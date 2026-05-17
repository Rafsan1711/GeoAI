"""Build C++ extension for Atlas Engine."""
from pybind11.setup_helpers import Pybind11Extension, build_ext
from setuptools import setup

ext = Pybind11Extension(
    "atlas_cpp",
    sources=["probability_ops.cpp"],
    cxx_std=17,
    extra_compile_args=["-O3", "-march=native"],
)

setup(
    name="atlas_cpp",
    ext_modules=[ext],
    cmdclass={"build_ext": build_ext},
)