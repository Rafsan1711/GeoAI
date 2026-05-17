// probability_ops.cpp — Hot-path probability operations
// Compile: python setup.py build_ext --inplace
#include <pybind11/pybind11.h>
#include <pybind11/stl.h>
#include <vector>
#include <algorithm>
#include <cmath>
#include <numeric>

namespace py = pybind11;

// Normalize probabilities in-place, returns sum
double normalize_probabilities(std::vector<double>& probs) {
    double total = 0.0;
    for (auto p : probs) if (p > 0) total += p;
    if (total < 1e-20) {
        double uniform = 1.0 / probs.size();
        std::fill(probs.begin(), probs.end(), uniform);
        return 1.0;
    }
    for (auto& p : probs) p /= total;
    return total;
}

// Shannon entropy of a probability vector
double shannon_entropy(const std::vector<double>& probs) {
    double h = 0.0;
    for (auto p : probs) {
        if (p > 1e-12) h -= p * std::log2(p);
    }
    return h;
}

// Information gain for a binary split
// yes_probs: probs of items matching the condition
// no_probs:  probs of items not matching
double information_gain_binary(
    const std::vector<double>& all_probs,
    const std::vector<int>&    match_mask   // 1 = matches, 0 = no
) {
    if (all_probs.empty()) return 0.0;

    double total = 0.0;
    for (auto p : all_probs) total += p;
    if (total < 1e-12) return 0.0;

    double H_before = shannon_entropy(all_probs);
    if (H_before < 1e-12) return 0.0;

    std::vector<double> yes_probs, no_probs;
    for (size_t i = 0; i < all_probs.size(); ++i) {
        if (match_mask[i]) yes_probs.push_back(all_probs[i]);
        else                no_probs.push_back(all_probs[i]);
    }

    double yes_sum = 0.0, no_sum = 0.0;
    for (auto p : yes_probs) yes_sum += p;
    for (auto p : no_probs)  no_sum  += p;

    double H_after = 0.0;
    if (yes_sum > 1e-12) {
        std::vector<double> yn(yes_probs);
        for (auto& p : yn) p /= yes_sum;
        H_after += (yes_sum / total) * shannon_entropy(yn);
    }
    if (no_sum > 1e-12) {
        std::vector<double> nn(no_probs);
        for (auto& p : nn) p /= no_sum;
        H_after += (no_sum / total) * shannon_entropy(nn);
    }

    double gain = (H_before - H_after) / (H_before + 1e-12);
    return std::max(0.0, std::min(1.0, gain));
}

// Soft filter: mark items for elimination
// Returns indices to eliminate
std::vector<int> soft_filter(
    const std::vector<double>& probs,
    int    min_keep,     // always keep at least this many
    double threshold_pct // eliminate if < threshold_pct * max_prob
) {
    if ((int)probs.size() <= min_keep) return {};

    double max_prob  = *std::max_element(probs.begin(), probs.end());
    double threshold = max_prob * threshold_pct;

    // Sort indices by probability descending
    std::vector<int> idx(probs.size());
    std::iota(idx.begin(), idx.end(), 0);
    std::sort(idx.begin(), idx.end(), [&](int a, int b){ return probs[a] > probs[b]; });

    std::vector<int> to_eliminate;
    int kept = 0;
    for (int i : idx) {
        if (kept < min_keep) { kept++; continue; }
        if (probs[i] < threshold) to_eliminate.push_back(i);
        else kept++;
    }
    return to_eliminate;
}

PYBIND11_MODULE(atlas_cpp, m) {
    m.doc() = "Atlas GMP Engine — C++ hot-path operations";

    m.def("normalize_probabilities", &normalize_probabilities,
          "Normalize probability vector in-place, returns total",
          py::arg("probs"));

    m.def("shannon_entropy", &shannon_entropy,
          "Compute Shannon entropy of probability vector",
          py::arg("probs"));

    m.def("information_gain_binary", &information_gain_binary,
          "Compute normalized information gain for binary split",
          py::arg("all_probs"), py::arg("match_mask"));

    m.def("soft_filter", &soft_filter,
          "Return indices to eliminate from probability vector",
          py::arg("probs"), py::arg("min_keep")=5, py::arg("threshold_pct")=0.005);
}