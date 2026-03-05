'use client'
﻿// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

function flagFromIso2(iso2) {
  if (!iso2 || typeof iso2 !== "string" || iso2.length !== 2) return "";
  const upper = iso2.toUpperCase();
  return String.fromCodePoint(...[...upper].map((char) => 127397 + char.charCodeAt(0)));
}

const COUNTRY_BASE = [
  { name: "India", iso2: "IN", code: "+91", currency: "INR", currencySymbol: "\u20B9" },
  { name: "United States", iso2: "US", code: "+1", currency: "USD", currencySymbol: "$" },
  { name: "United Kingdom", iso2: "GB", code: "+44", currency: "GBP", currencySymbol: "\u00A3" },
  { name: "Canada", iso2: "CA", code: "+1", currency: "CAD", currencySymbol: "C$" },
  { name: "Australia", iso2: "AU", code: "+61", currency: "AUD", currencySymbol: "A$" },
  { name: "Germany", iso2: "DE", code: "+49", currency: "EUR", currencySymbol: "\u20AC" },
  { name: "France", iso2: "FR", code: "+33", currency: "EUR", currencySymbol: "\u20AC" },
  { name: "Japan", iso2: "JP", code: "+81", currency: "JPY", currencySymbol: "\u00A5" },
  { name: "China", iso2: "CN", code: "+86", currency: "CNY", currencySymbol: "\u00A5" },
  { name: "Brazil", iso2: "BR", code: "+55", currency: "BRL", currencySymbol: "R$" },
  { name: "Mexico", iso2: "MX", code: "+52", currency: "MXN", currencySymbol: "MX$" },
  { name: "South Korea", iso2: "KR", code: "+82", currency: "KRW", currencySymbol: "\u20A9" },
  { name: "Italy", iso2: "IT", code: "+39", currency: "EUR", currencySymbol: "\u20AC" },
  { name: "Spain", iso2: "ES", code: "+34", currency: "EUR", currencySymbol: "\u20AC" },
  { name: "Netherlands", iso2: "NL", code: "+31", currency: "EUR", currencySymbol: "\u20AC" },
  { name: "Singapore", iso2: "SG", code: "+65", currency: "SGD", currencySymbol: "S$" },
  { name: "United Arab Emirates", iso2: "AE", code: "+971", currency: "AED", currencySymbol: "\u062F.\u0625" },
  { name: "Saudi Arabia", iso2: "SA", code: "+966", currency: "SAR", currencySymbol: "\uFDFC" },
  { name: "South Africa", iso2: "ZA", code: "+27", currency: "ZAR", currencySymbol: "R" },
  { name: "Russia", iso2: "RU", code: "+7", currency: "RUB", currencySymbol: "\u20BD" },
  { name: "Indonesia", iso2: "ID", code: "+62", currency: "IDR", currencySymbol: "Rp" },
  { name: "Thailand", iso2: "TH", code: "+66", currency: "THB", currencySymbol: "\u0E3F" },
  { name: "Malaysia", iso2: "MY", code: "+60", currency: "MYR", currencySymbol: "RM" },
  { name: "Philippines", iso2: "PH", code: "+63", currency: "PHP", currencySymbol: "\u20B1" },
  { name: "Bangladesh", iso2: "BD", code: "+880", currency: "BDT", currencySymbol: "\u09F3" },
  { name: "Pakistan", iso2: "PK", code: "+92", currency: "PKR", currencySymbol: "\u20A8" },
  { name: "Sri Lanka", iso2: "LK", code: "+94", currency: "LKR", currencySymbol: "Rs" },
  { name: "Nepal", iso2: "NP", code: "+977", currency: "NPR", currencySymbol: "\u0930\u0942" },
  { name: "Nigeria", iso2: "NG", code: "+234", currency: "NGN", currencySymbol: "\u20A6" },
  { name: "Kenya", iso2: "KE", code: "+254", currency: "KES", currencySymbol: "KSh" },
];

export const COUNTRIES = COUNTRY_BASE.map((country) => ({
  ...country,
  flag: flagFromIso2(country.iso2),
}));

export function getCountryByName(name) {
  return COUNTRIES.find((country) => country.name === name) || null;
}

