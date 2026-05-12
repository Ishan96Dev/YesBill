// Country data for account setup — mirrors frontend-next/lib/countries.js + timezone.js
class AppCountry {
  const AppCountry({
    required this.name,
    required this.iso2,
    required this.dialCode,
    required this.flag,
    required this.currency,
    required this.currencySymbol,
    required this.timezone,
  });

  final String name;
  final String iso2;
  final String dialCode;
  final String flag;
  final String currency;
  final String currencySymbol;
  final String timezone;
}

String _flag(String iso2) {
  final upper = iso2.toUpperCase();
  return upper.codeUnits
      .map((c) => String.fromCharCode(0x1F1E6 - 0x41 + c))
      .join();
}

final kAppCountries = <AppCountry>[
  AppCountry(name: 'India',                iso2: 'IN', dialCode: '+91',  flag: _flag('IN'), currency: 'INR', currencySymbol: '₹',   timezone: 'Asia/Kolkata'),
  AppCountry(name: 'United States',        iso2: 'US', dialCode: '+1',   flag: _flag('US'), currency: 'USD', currencySymbol: '\$',   timezone: 'America/New_York'),
  AppCountry(name: 'United Kingdom',       iso2: 'GB', dialCode: '+44',  flag: _flag('GB'), currency: 'GBP', currencySymbol: '£',   timezone: 'Europe/London'),
  AppCountry(name: 'Canada',               iso2: 'CA', dialCode: '+1',   flag: _flag('CA'), currency: 'CAD', currencySymbol: 'C\$', timezone: 'America/Toronto'),
  AppCountry(name: 'Australia',            iso2: 'AU', dialCode: '+61',  flag: _flag('AU'), currency: 'AUD', currencySymbol: 'A\$', timezone: 'Australia/Sydney'),
  AppCountry(name: 'Germany',              iso2: 'DE', dialCode: '+49',  flag: _flag('DE'), currency: 'EUR', currencySymbol: '€',   timezone: 'Europe/Berlin'),
  AppCountry(name: 'France',               iso2: 'FR', dialCode: '+33',  flag: _flag('FR'), currency: 'EUR', currencySymbol: '€',   timezone: 'Europe/Paris'),
  AppCountry(name: 'Japan',                iso2: 'JP', dialCode: '+81',  flag: _flag('JP'), currency: 'JPY', currencySymbol: '¥',   timezone: 'Asia/Tokyo'),
  AppCountry(name: 'China',                iso2: 'CN', dialCode: '+86',  flag: _flag('CN'), currency: 'CNY', currencySymbol: '¥',   timezone: 'Asia/Shanghai'),
  AppCountry(name: 'Brazil',               iso2: 'BR', dialCode: '+55',  flag: _flag('BR'), currency: 'BRL', currencySymbol: 'R\$', timezone: 'America/Sao_Paulo'),
  AppCountry(name: 'Mexico',               iso2: 'MX', dialCode: '+52',  flag: _flag('MX'), currency: 'MXN', currencySymbol: 'MX\$', timezone: 'America/Mexico_City'),
  AppCountry(name: 'South Korea',          iso2: 'KR', dialCode: '+82',  flag: _flag('KR'), currency: 'KRW', currencySymbol: '₩',   timezone: 'Asia/Seoul'),
  AppCountry(name: 'Italy',                iso2: 'IT', dialCode: '+39',  flag: _flag('IT'), currency: 'EUR', currencySymbol: '€',   timezone: 'Europe/Rome'),
  AppCountry(name: 'Spain',                iso2: 'ES', dialCode: '+34',  flag: _flag('ES'), currency: 'EUR', currencySymbol: '€',   timezone: 'Europe/Madrid'),
  AppCountry(name: 'Netherlands',          iso2: 'NL', dialCode: '+31',  flag: _flag('NL'), currency: 'EUR', currencySymbol: '€',   timezone: 'Europe/Amsterdam'),
  AppCountry(name: 'Singapore',            iso2: 'SG', dialCode: '+65',  flag: _flag('SG'), currency: 'SGD', currencySymbol: 'S\$', timezone: 'Asia/Singapore'),
  AppCountry(name: 'United Arab Emirates', iso2: 'AE', dialCode: '+971', flag: _flag('AE'), currency: 'AED', currencySymbol: 'د.إ', timezone: 'Asia/Dubai'),
  AppCountry(name: 'Saudi Arabia',         iso2: 'SA', dialCode: '+966', flag: _flag('SA'), currency: 'SAR', currencySymbol: '﷼',   timezone: 'Asia/Riyadh'),
  AppCountry(name: 'South Africa',         iso2: 'ZA', dialCode: '+27',  flag: _flag('ZA'), currency: 'ZAR', currencySymbol: 'R',   timezone: 'Africa/Johannesburg'),
  AppCountry(name: 'Russia',               iso2: 'RU', dialCode: '+7',   flag: _flag('RU'), currency: 'RUB', currencySymbol: '₽',   timezone: 'Europe/Moscow'),
  AppCountry(name: 'Indonesia',            iso2: 'ID', dialCode: '+62',  flag: _flag('ID'), currency: 'IDR', currencySymbol: 'Rp',  timezone: 'Asia/Jakarta'),
  AppCountry(name: 'Thailand',             iso2: 'TH', dialCode: '+66',  flag: _flag('TH'), currency: 'THB', currencySymbol: '฿',   timezone: 'Asia/Bangkok'),
  AppCountry(name: 'Malaysia',             iso2: 'MY', dialCode: '+60',  flag: _flag('MY'), currency: 'MYR', currencySymbol: 'RM',  timezone: 'Asia/Kuala_Lumpur'),
  AppCountry(name: 'Philippines',          iso2: 'PH', dialCode: '+63',  flag: _flag('PH'), currency: 'PHP', currencySymbol: '₱',   timezone: 'Asia/Manila'),
  AppCountry(name: 'Bangladesh',           iso2: 'BD', dialCode: '+880', flag: _flag('BD'), currency: 'BDT', currencySymbol: '৳',   timezone: 'Asia/Dhaka'),
  AppCountry(name: 'Pakistan',             iso2: 'PK', dialCode: '+92',  flag: _flag('PK'), currency: 'PKR', currencySymbol: '₨',   timezone: 'Asia/Karachi'),
  AppCountry(name: 'Sri Lanka',            iso2: 'LK', dialCode: '+94',  flag: _flag('LK'), currency: 'LKR', currencySymbol: 'Rs',  timezone: 'Asia/Colombo'),
  AppCountry(name: 'Nepal',                iso2: 'NP', dialCode: '+977', flag: _flag('NP'), currency: 'NPR', currencySymbol: 'रू',  timezone: 'Asia/Kathmandu'),
  AppCountry(name: 'Nigeria',              iso2: 'NG', dialCode: '+234', flag: _flag('NG'), currency: 'NGN', currencySymbol: '₦',   timezone: 'Africa/Lagos'),
  AppCountry(name: 'Kenya',                iso2: 'KE', dialCode: '+254', flag: _flag('KE'), currency: 'KES', currencySymbol: 'KSh', timezone: 'Africa/Nairobi'),
  AppCountry(name: 'Argentina',            iso2: 'AR', dialCode: '+54',  flag: _flag('AR'), currency: 'ARS', currencySymbol: '\$',   timezone: 'America/Argentina/Buenos_Aires'),
  AppCountry(name: 'Chile',                iso2: 'CL', dialCode: '+56',  flag: _flag('CL'), currency: 'CLP', currencySymbol: '\$',   timezone: 'America/Santiago'),
  AppCountry(name: 'Colombia',             iso2: 'CO', dialCode: '+57',  flag: _flag('CO'), currency: 'COP', currencySymbol: '\$',   timezone: 'America/Bogota'),
  AppCountry(name: 'Sweden',               iso2: 'SE', dialCode: '+46',  flag: _flag('SE'), currency: 'SEK', currencySymbol: 'kr',  timezone: 'Europe/Stockholm'),
  AppCountry(name: 'Norway',               iso2: 'NO', dialCode: '+47',  flag: _flag('NO'), currency: 'NOK', currencySymbol: 'kr',  timezone: 'Europe/Oslo'),
  AppCountry(name: 'Denmark',              iso2: 'DK', dialCode: '+45',  flag: _flag('DK'), currency: 'DKK', currencySymbol: 'kr',  timezone: 'Europe/Copenhagen'),
  AppCountry(name: 'Switzerland',          iso2: 'CH', dialCode: '+41',  flag: _flag('CH'), currency: 'CHF', currencySymbol: 'CHF', timezone: 'Europe/Zurich'),
  AppCountry(name: 'Portugal',             iso2: 'PT', dialCode: '+351', flag: _flag('PT'), currency: 'EUR', currencySymbol: '€',   timezone: 'Europe/Lisbon'),
  AppCountry(name: 'Poland',               iso2: 'PL', dialCode: '+48',  flag: _flag('PL'), currency: 'PLN', currencySymbol: 'zł',  timezone: 'Europe/Warsaw'),
  AppCountry(name: 'Turkey',               iso2: 'TR', dialCode: '+90',  flag: _flag('TR'), currency: 'TRY', currencySymbol: '₺',   timezone: 'Europe/Istanbul'),
  AppCountry(name: 'Israel',               iso2: 'IL', dialCode: '+972', flag: _flag('IL'), currency: 'ILS', currencySymbol: '₪',   timezone: 'Asia/Jerusalem'),
  AppCountry(name: 'Egypt',                iso2: 'EG', dialCode: '+20',  flag: _flag('EG'), currency: 'EGP', currencySymbol: '£',   timezone: 'Africa/Cairo'),
  AppCountry(name: 'Vietnam',              iso2: 'VN', dialCode: '+84',  flag: _flag('VN'), currency: 'VND', currencySymbol: '₫',   timezone: 'Asia/Ho_Chi_Minh'),
  AppCountry(name: 'Ukraine',              iso2: 'UA', dialCode: '+380', flag: _flag('UA'), currency: 'UAH', currencySymbol: '₴',   timezone: 'Europe/Kiev'),
  AppCountry(name: 'New Zealand',          iso2: 'NZ', dialCode: '+64',  flag: _flag('NZ'), currency: 'NZD', currencySymbol: 'NZ\$', timezone: 'Pacific/Auckland'),
];
