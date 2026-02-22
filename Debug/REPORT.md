# 🌍 GeoAI Bot Test — Analytical Report

> **Generated:** Sun, 22 Feb 2026 06:03:16 GMT
> **Run Duration:** 32m 48s  |  **Concurrency:** 30  |  **Bot v2.0**

---

## 📊 Section 1: Executive Summary

| Metric | Value | Notes |
|--------|-------|-------|
| **Overall Accuracy** | **94.74%** | Target: ≥95% |
| Countries Tested | 114 / 115 | 1 skipped |
| Correct | ✅ 108 | |
| Wrong | ❌ 6 | |
| Avg Questions/Game | 10.6 | Lower = smarter |
| Total Questions Asked | 1210 | |
| Run Duration | 32m 48s | |
| Status | ⚠️ BELOW TARGET | |

---

## 🌍 Section 2: Performance by Continent

| Continent | Total | ✅ | ❌ | Accuracy | Avg Qs | Fastest | Slowest |
|-----------|-------|----|----|----------|--------|---------|---------|
| 🌎 **North America** | 9 | 9 | 0 | **100.0%** `██████████` | 10.4q | Costa Rica (6q) | United States (11q) |
| 🌎 **South America** | 10 | 10 | 0 | **100.0%** `██████████` | 11.0q | Brazil (11q) | Brazil (11q) |
| 🌏 **Oceania** | 2 | 2 | 0 | **100.0%** `██████████` | 11.0q | Australia (11q) | Australia (11q) |
| 🌍 **Africa** | 19 | 19 | 0 | **100.0%** `██████████` | 11.0q | South Africa (11q) | South Africa (11q) |
| 🌏 **Asia** | 39 | 37 | 2 | **94.9%** `█████████░` | 10.3q | Indonesia (5q) | Bangladesh (12q) |
| 🌍 **Europe** | 36 | 32 | 4 | **88.9%** `█████████░` | 10.7q | Croatia (4q) | Lithuania (21q) |

### Continent Notes

- ✅ **North America** excellent accuracy (100.0%).
- ✅ **South America** excellent accuracy (100.0%).
- ✅ **Oceania** excellent accuracy (100.0%).
- ✅ **Africa** excellent accuracy (100.0%).

---

## ⚡ Section 3: Speed Analysis

### 🏆 Top 10 Fastest Correct Guesses

| Rank | Country | Questions | Confidence |
|------|---------|-----------|------------|
| 1 | 🇭🇷 Croatia | **4** | 33% |
| 2 | 🇮🇩 Indonesia | **5** | 33% |
| 3 | 🇫🇮 Finland | **5** | 33% |
| 4 | 🇨🇷 Costa Rica | **6** | 97% |
| 5 | 🇰🇼 Kuwait | **7** | 95% |
| 6 | 🇶🇦 Qatar | **7** | 95% |
| 7 | 🇧🇭 Bahrain | **7** | 95% |
| 8 | 🇮🇳 India | **11** | 95% |
| 9 | 🇺🇸 United States | **11** | 95% |
| 10 | 🇨🇳 China | **11** | 95% |

### 🐢 Top 10 Slowest Correct Guesses

| Rank | Country | Questions | Confidence |
|------|---------|-----------|------------|
| 1 | 🇱🇹 Lithuania | **21** | 36% |
| 2 | 🇧🇩 Bangladesh | **12** | 34% |
| 3 | 🇹🇹 Trinidad and Tobago | **11** | 95% |
| 4 | 🇧🇸 Bahamas | **11** | 95% |
| 5 | 🇨🇾 Cyprus | **11** | 95% |
| 6 | 🇱🇺 Luxembourg | **11** | 95% |
| 7 | 🇲🇩 Moldova | **11** | 95% |
| 8 | 🇲🇰 North Macedonia | **11** | 95% |
| 9 | 🇧🇦 Bosnia and Herzegovina | **11** | 95% |
| 10 | 🇪🇪 Estonia | **11** | 95% |

---

## ❌ Section 4: Failed Cases

> 6 wrong — analyze to improve dataset or algorithm.

| # | Country | Guessed As | Questions | Confidence | Debug |
|---|---------|------------|-----------|------------|-------|
| 1 | 🇩🇰 **Denmark** | Finland | 5q | 33% | [Debug](Countries/Denmark.md) |
| 2 | 🇵🇭 **Philippines** | Indonesia | 5q | 33% | [Debug](Countries/Philippines.md) |
| 3 | 🇦🇫 **Afghanistan** | Uzbekistan | 5q | 33% | [Debug](Countries/Afghanistan.md) |
| 4 | 🇱🇻 **Latvia** | Lithuania | 21q | 36% | [Debug](Countries/Latvia.md) |
| 5 | 🇦🇱 **Albania** | Croatia | 4q | 33% | [Debug](Countries/Albania.md) |
| 6 | 🇲🇹 **Malta** | Portugal | 7q | 33% | [Debug](Countries/Malta.md) |

---

## 🔀 Section 5: Confusion Analysis

| # | Actual | Guessed As | Times | Hint |
|---|--------|------------|-------|------|
| 1 | 🇩🇰 **Denmark** | 🇫🇮 Finland | 1x | Same region — add sub-region questions |
| 2 | 🇵🇭 **Philippines** | 🇮🇩 Indonesia | 1x | Same region — add sub-region questions |
| 3 | 🇦🇫 **Afghanistan** | 🇺🇿 Uzbekistan | 1x | Same continent — add regional questions |
| 4 | 🇦🇱 **Albania** | 🇭🇷 Croatia | 1x | Same region — add sub-region questions |
| 5 | 🇲🇹 **Malta** | 🇵🇹 Portugal | 1x | Same region — add sub-region questions |
| 6 | 🇱🇻 **Latvia** | 🇱🇹 Lithuania | 1x | Same region — add sub-region questions |

### Most Confused Countries

**🇩🇰 Denmark** was confused with:
- 🇫🇮 Finland (1x)

**🇵🇭 Philippines** was confused with:
- 🇮🇩 Indonesia (1x)

**🇦🇫 Afghanistan** was confused with:
- 🇺🇿 Uzbekistan (1x)

**🇦🇱 Albania** was confused with:
- 🇭🇷 Croatia (1x)

**🇲🇹 Malta** was confused with:
- 🇵🇹 Portugal (1x)

**🇱🇻 Latvia** was confused with:
- 🇱🇹 Lithuania (1x)

---

## 📈 Section 6: Question Attribute Effectiveness

> Avg Confidence Δ per question — higher = more useful attribute.

| Rank | Attribute | Asked | Avg Conf Δ | Win Rate | Verdict |
|------|-----------|-------|-----------|----------|---------|
| 1 | `isIsland` | 30 | **+18.14%** | 97% | 🔥 Highly Effective |
| 2 | `mainReligion` | 52 | **+15.71%** | 96% | 🔥 Highly Effective |
| 3 | `exports` | 129 | **+13.00%** | 98% | 🔥 Highly Effective |
| 4 | `formerColony` | 15 | **+12.77%** | 100% | 🔥 Highly Effective |
| 5 | `population` | 87 | **+12.66%** | 99% | 🔥 Highly Effective |
| 6 | `government` | 29 | **+11.89%** | 97% | 🔥 Highly Effective |
| 7 | `driveSide` | 13 | **+9.30%** | 100% | 🔥 Highly Effective |
| 8 | `hasNobel` | 70 | **+9.04%** | 99% | 🔥 Highly Effective |
| 9 | `hasCoast` | 11 | **+8.42%** | 100% | 🔥 Highly Effective |
| 10 | `continent` | 192 | **+7.66%** | 95% | 🔥 Highly Effective |
| 11 | `climate` | 69 | **+6.92%** | 94% | 🔥 Highly Effective |
| 12 | `subRegion` | 177 | **+6.69%** | 94% | 🔥 Highly Effective |
| 13 | `landlocked` | 40 | **+6.61%** | 95% | 🔥 Highly Effective |
| 14 | `hasRivers` | 43 | **+6.58%** | 95% | 🔥 Highly Effective |
| 15 | `neighbors` | 51 | **+5.91%** | 94% | 🔥 Highly Effective |
| 16 | `colonizedBy` | 54 | **+5.15%** | 100% | 🔥 Highly Effective |
| 17 | `hasMountains` | 84 | **+4.39%** | 95% | ✅ Effective |
| 18 | `hasUNESCO` | 20 | **+2.83%** | 100% | ✅ Effective |
| 19 | `language` | 16 | **+0.12%** | 94% | 🟡 Moderate |
| 20 | `famousFor` | 33 | **+0.02%** | 94% | 🟡 Moderate |
| 21 | `landmarks` | 3 | **-0.00%** | 100% | 🔴 Weak — Review |
| 22 | `avgTemperature` | 2 | **-0.00%** | 100% | 🔴 Weak — Review |
| 23 | `hasWonder` | 2 | **-0.00%** | 100% | 🔴 Weak — Review |

### 💡 Weight Recommendations

**Increase weight for:** `isIsland`, `mainReligion`, `exports`, `formerColony`, `population`, `government`, `driveSide`, `hasNobel`, `hasCoast`, `continent`, `climate`, `subRegion`, `landlocked`, `hasRivers`, `neighbors`, `colonizedBy`

**Decrease weight / Review:** `landmarks`, `avgTemperature`, `hasWonder`

---

## 🔧 Section 7: Algorithm Tuning Suggestions

**Current Accuracy:** 94.74% — ⚠️ 0.26% below 95% target

1. **Top confusion pair:** "Denmark" ↔ "Finland" — add a question that discriminates these two countries.
2. **Weakest continent:** Europe (88.9%) — focus question expansion here.
3. **Best attribute:** `isIsland` (Δ=18.14%) — ensure asked early (Stage 0-2).
4. **Weak attributes:** `landmarks`, `avgTemperature`, `hasWonder` — consider removing or replacing these questions.
5. **1 countries took >20 questions AND were wrong** — check their data for missing unique attributes.

---

## 🏴 Section 8: Data Quality Flags

Countries that may need data enrichment (>20 questions AND wrong):

| Country | Questions | Suggestion |
|---------|-----------|------------|
| 🇱🇻 **Latvia** | 21q | Add unique discriminating attributes |

---

## 📁 Section 9: Full Country Index

| Country | Result | Questions | Confidence | Predicted | Debug |
|---------|--------|-----------|------------|-----------|-------|
| 🇦🇫 Afghanistan | ❌ | 5q | 33% | Uzbekistan | [Debug](Countries/Afghanistan.md) |
| 🇦🇱 Albania | ❌ | 4q | 33% | Croatia | [Debug](Countries/Albania.md) |
| 🇩🇿 Algeria | ✅ | 11q | 95% | Algeria | [Debug](Countries/Algeria.md) |
| 🇦🇴 Angola | ✅ | 11q | 95% | Angola | [Debug](Countries/Angola.md) |
| 🇦🇷 Argentina | ✅ | 11q | 95% | Argentina | [Debug](Countries/Argentina.md) |
| 🇦🇺 Australia | ✅ | 11q | 95% | Australia | [Debug](Countries/Australia.md) |
| 🇦🇹 Austria | ✅ | 11q | 95% | Austria | [Debug](Countries/Austria.md) |
| 🇦🇿 Azerbaijan | ✅ | 11q | 95% | Azerbaijan | [Debug](Countries/Azerbaijan.md) |
| 🇧🇸 Bahamas | ✅ | 11q | 95% | Bahamas | [Debug](Countries/Bahamas.md) |
| 🇧🇭 Bahrain | ✅ | 7q | 95% | Bahrain | [Debug](Countries/Bahrain.md) |
| 🇧🇩 Bangladesh | ✅ | 12q | 34% | Bangladesh | [Debug](Countries/Bangladesh.md) |
| 🇧🇪 Belgium | ✅ | 11q | 95% | Belgium | [Debug](Countries/Belgium.md) |
| 🇧🇴 Bolivia | ✅ | 11q | 95% | Bolivia | [Debug](Countries/Bolivia.md) |
| 🇧🇦 Bosnia and Herzegovina | ✅ | 11q | 95% | Bosnia and Herzegovina | [Debug](Countries/Bosnia and Herzegovina.md) |
| 🇧🇷 Brazil | ✅ | 11q | 95% | Brazil | [Debug](Countries/Brazil.md) |
| 🇧🇳 Brunei | ✅ | 11q | 95% | Brunei | [Debug](Countries/Brunei.md) |
| 🇰🇭 Cambodia | ✅ | 11q | 95% | Cambodia | [Debug](Countries/Cambodia.md) |
| 🇨🇲 Cameroon | ✅ | 11q | 95% | Cameroon | [Debug](Countries/Cameroon.md) |
| 🇨🇦 Canada | ✅ | 11q | 95% | Canada | [Debug](Countries/Canada.md) |
| 🇨🇱 Chile | ✅ | 11q | 95% | Chile | [Debug](Countries/Chile.md) |
| 🇨🇳 China | ✅ | 11q | 95% | China | [Debug](Countries/China.md) |
| 🇨🇴 Colombia | ✅ | 11q | 95% | Colombia | [Debug](Countries/Colombia.md) |
| 🇨🇷 Costa Rica | ✅ | 6q | 97% | Costa Rica | [Debug](Countries/Costa Rica.md) |
| 🇭🇷 Croatia | ✅ | 4q | 33% | Croatia | [Debug](Countries/Croatia.md) |
| 🇨🇺 Cuba | ✅ | 11q | 95% | Cuba | [Debug](Countries/Cuba.md) |
| 🇨🇾 Cyprus | ✅ | 11q | 95% | Cyprus | [Debug](Countries/Cyprus.md) |
| 🇨🇿 Czech Republic | ✅ | 11q | 95% | Czech Republic | [Debug](Countries/Czech Republic.md) |
| 🇩🇰 Denmark | ❌ | 5q | 33% | Finland | [Debug](Countries/Denmark.md) |
| 🇪🇨 Ecuador | ✅ | 11q | 95% | Ecuador | [Debug](Countries/Ecuador.md) |
| 🇪🇬 Egypt | ✅ | 11q | 95% | Egypt | [Debug](Countries/Egypt.md) |
| 🇪🇪 Estonia | ✅ | 11q | 95% | Estonia | [Debug](Countries/Estonia.md) |
| 🇪🇹 Ethiopia | ✅ | 11q | 95% | Ethiopia | [Debug](Countries/Ethiopia.md) |
| 🇫🇮 Finland | ✅ | 5q | 33% | Finland | [Debug](Countries/Finland.md) |
| 🇫🇷 France | ✅ | 11q | 95% | France | [Debug](Countries/France.md) |
| 🇬🇪 Georgia | ✅ | 11q | 95% | Georgia | [Debug](Countries/Georgia.md) |
| 🇩🇪 Germany | ✅ | 11q | 95% | Germany | [Debug](Countries/Germany.md) |
| 🇬🇭 Ghana | ✅ | 11q | 95% | Ghana | [Debug](Countries/Ghana.md) |
| 🇬🇷 Greece | ✅ | 11q | 95% | Greece | [Debug](Countries/Greece.md) |
| 🇭🇺 Hungary | ✅ | 11q | 95% | Hungary | [Debug](Countries/Hungary.md) |
| 🇮🇸 Iceland | ✅ | 11q | 95% | Iceland | [Debug](Countries/Iceland.md) |
| 🇮🇳 India | ✅ | 11q | 95% | India | [Debug](Countries/India.md) |
| 🇮🇩 Indonesia | ✅ | 5q | 33% | Indonesia | [Debug](Countries/Indonesia.md) |
| 🇮🇷 Iran | ✅ | 11q | 95% | Iran | [Debug](Countries/Iran.md) |
| 🇮🇶 Iraq | ✅ | 11q | 95% | Iraq | [Debug](Countries/Iraq.md) |
| 🇮🇱 Israel | ✅ | 11q | 95% | Israel | [Debug](Countries/Israel.md) |
| 🇮🇹 Italy | ✅ | 11q | 95% | Italy | [Debug](Countries/Italy.md) |
| 🇯🇲 Jamaica | ✅ | 11q | 95% | Jamaica | [Debug](Countries/Jamaica.md) |
| 🇯🇵 Japan | ✅ | 11q | 95% | Japan | [Debug](Countries/Japan.md) |
| 🇯🇴 Jordan | ✅ | 11q | 95% | Jordan | [Debug](Countries/Jordan.md) |
| 🇰🇿 Kazakhstan | ✅ | 11q | 95% | Kazakhstan | [Debug](Countries/Kazakhstan.md) |
| 🇰🇪 Kenya | ✅ | 11q | 95% | Kenya | [Debug](Countries/Kenya.md) |
| 🇰🇼 Kuwait | ✅ | 7q | 95% | Kuwait | [Debug](Countries/Kuwait.md) |
| 🇱🇦 Laos | ✅ | 11q | 95% | Laos | [Debug](Countries/Laos.md) |
| 🇱🇻 Latvia | ❌ | 21q | 36% | Lithuania | [Debug](Countries/Latvia.md) |
| 🇱🇧 Lebanon | ✅ | 11q | 95% | Lebanon | [Debug](Countries/Lebanon.md) |
| 🇱🇾 Libya | ✅ | 11q | 95% | Libya | [Debug](Countries/Libya.md) |
| 🇱🇹 Lithuania | ✅ | 21q | 36% | Lithuania | [Debug](Countries/Lithuania.md) |
| 🇱🇺 Luxembourg | ✅ | 11q | 95% | Luxembourg | [Debug](Countries/Luxembourg.md) |
| 🇲🇬 Madagascar | ✅ | 11q | 95% | Madagascar | [Debug](Countries/Madagascar.md) |
| 🇲🇾 Malaysia | ✅ | 11q | 95% | Malaysia | [Debug](Countries/Malaysia.md) |
| 🇲🇹 Malta | ❌ | 7q | 33% | Portugal | [Debug](Countries/Malta.md) |
| 🇲🇽 Mexico | ✅ | 11q | 95% | Mexico | [Debug](Countries/Mexico.md) |
| 🇲🇩 Moldova | ✅ | 11q | 95% | Moldova | [Debug](Countries/Moldova.md) |
| 🇲🇳 Mongolia | ✅ | 11q | 95% | Mongolia | [Debug](Countries/Mongolia.md) |
| 🇲🇦 Morocco | ✅ | 11q | 95% | Morocco | [Debug](Countries/Morocco.md) |
| 🇲🇿 Mozambique | ✅ | 11q | 95% | Mozambique | [Debug](Countries/Mozambique.md) |
| 🇲🇲 Myanmar | ✅ | 11q | 95% | Myanmar | [Debug](Countries/Myanmar.md) |
| 🇳🇵 Nepal | ✅ | 11q | 95% | Nepal | [Debug](Countries/Nepal.md) |
| 🇳🇱 Netherlands | ✅ | 11q | 95% | Netherlands | [Debug](Countries/Netherlands.md) |
| 🇳🇿 New Zealand | ✅ | 11q | 95% | New Zealand | [Debug](Countries/New Zealand.md) |
| 🇳🇬 Nigeria | ✅ | 11q | 95% | Nigeria | [Debug](Countries/Nigeria.md) |
| 🇰🇵 North Korea | ✅ | 11q | 95% | North Korea | [Debug](Countries/North Korea.md) |
| 🇲🇰 North Macedonia | ✅ | 11q | 95% | North Macedonia | [Debug](Countries/North Macedonia.md) |
| 🇳🇴 Norway | ✅ | 11q | 95% | Norway | [Debug](Countries/Norway.md) |
| 🇴🇲 Oman | ✅ | 11q | 95% | Oman | [Debug](Countries/Oman.md) |
| 🇵🇰 Pakistan | ✅ | 11q | 95% | Pakistan | [Debug](Countries/Pakistan.md) |
| 🇵🇦 Panama | ✅ | 11q | 95% | Panama | [Debug](Countries/Panama.md) |
| 🇵🇾 Paraguay | ✅ | 11q | 95% | Paraguay | [Debug](Countries/Paraguay.md) |
| 🇵🇪 Peru | ✅ | 11q | 95% | Peru | [Debug](Countries/Peru.md) |
| 🇵🇭 Philippines | ❌ | 5q | 33% | Indonesia | [Debug](Countries/Philippines.md) |
| 🇵🇱 Poland | ✅ | 11q | 95% | Poland | [Debug](Countries/Poland.md) |
| 🇵🇹 Portugal | ✅ | 11q | 95% | Portugal | [Debug](Countries/Portugal.md) |
| 🇶🇦 Qatar | ✅ | 7q | 95% | Qatar | [Debug](Countries/Qatar.md) |
| 🇷🇴 Romania | ✅ | 11q | 95% | Romania | [Debug](Countries/Romania.md) |
| 🇷🇺 Russia | ✅ | 11q | 95% | Russia | [Debug](Countries/Russia.md) |
| 🇸🇦 Saudi Arabia | ✅ | 11q | 95% | Saudi Arabia | [Debug](Countries/Saudi Arabia.md) |
| 🇸🇳 Senegal | ✅ | 11q | 95% | Senegal | [Debug](Countries/Senegal.md) |
| 🇷🇸 Serbia | ✅ | 11q | 95% | Serbia | [Debug](Countries/Serbia.md) |
| 🇸🇬 Singapore | ✅ | 11q | 95% | Singapore | [Debug](Countries/Singapore.md) |
| 🇸🇰 Slovakia | ✅ | 11q | 95% | Slovakia | [Debug](Countries/Slovakia.md) |
| 🇸🇮 Slovenia | ✅ | 11q | 95% | Slovenia | [Debug](Countries/Slovenia.md) |
| 🇿🇦 South Africa | ✅ | 11q | 95% | South Africa | [Debug](Countries/South Africa.md) |
| 🇰🇷 South Korea | ✅ | 11q | 95% | South Korea | [Debug](Countries/South Korea.md) |
| 🇪🇸 Spain | ✅ | 11q | 95% | Spain | [Debug](Countries/Spain.md) |
| 🇱🇰 Sri Lanka | ✅ | 11q | 95% | Sri Lanka | [Debug](Countries/Sri Lanka.md) |
| 🇸🇪 Sweden | ✅ | 11q | 95% | Sweden | [Debug](Countries/Sweden.md) |
| 🇨🇭 Switzerland | ✅ | 11q | 95% | Switzerland | [Debug](Countries/Switzerland.md) |
| 🇹🇿 Tanzania | ✅ | 11q | 95% | Tanzania | [Debug](Countries/Tanzania.md) |
| 🇹🇭 Thailand | ✅ | 11q | 95% | Thailand | [Debug](Countries/Thailand.md) |
| 🇹🇹 Trinidad and Tobago | ✅ | 11q | 95% | Trinidad and Tobago | [Debug](Countries/Trinidad and Tobago.md) |
| 🇹🇳 Tunisia | ✅ | 11q | 95% | Tunisia | [Debug](Countries/Tunisia.md) |
| 🇹🇷 Turkey | ✅ | 11q | 95% | Turkey | [Debug](Countries/Turkey.md) |
| 🇺🇬 Uganda | ✅ | 11q | 95% | Uganda | [Debug](Countries/Uganda.md) |
| 🇺🇦 Ukraine | ✅ | 11q | 95% | Ukraine | [Debug](Countries/Ukraine.md) |
| 🇦🇪 United Arab Emirates | ✅ | 11q | 95% | United Arab Emirates | [Debug](Countries/United Arab Emirates.md) |
| 🇬🇧 United Kingdom | ✅ | 11q | 95% | United Kingdom | [Debug](Countries/United Kingdom.md) |
| 🇺🇸 United States | ✅ | 11q | 95% | United States | [Debug](Countries/United States.md) |
| 🇺🇾 Uruguay | ✅ | 11q | 95% | Uruguay | [Debug](Countries/Uruguay.md) |
| 🇺🇿 Uzbekistan | ✅ | 11q | 95% | Uzbekistan | [Debug](Countries/Uzbekistan.md) |
| 🇻🇪 Venezuela | ✅ | 11q | 95% | Venezuela | [Debug](Countries/Venezuela.md) |
| 🇻🇳 Vietnam | ✅ | 11q | 95% | Vietnam | [Debug](Countries/Vietnam.md) |
| 🇾🇪 Yemen | ✅ | 11q | 95% | Yemen | [Debug](Countries/Yemen.md) |
| 🇿🇲 Zambia | ✅ | 11q | 95% | Zambia | [Debug](Countries/Zambia.md) |
| 🇿🇼 Zimbabwe | ✅ | 11q | 95% | Zimbabwe | [Debug](Countries/Zimbabwe.md) |

---

*GeoAI Bot Runner v2.0 — Sun, 22 Feb 2026 06:03:16 GMT*