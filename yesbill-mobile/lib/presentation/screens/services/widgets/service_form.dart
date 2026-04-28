import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../../core/constants/service_icons.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/extensions/context_extensions.dart';
import '../../../../core/extensions/date_extensions.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../data/models/user_service.dart';

class ServiceForm extends StatefulWidget {
  const ServiceForm({
    super.key,
    this.initial,
    required this.onSubmit,
    required this.submitLabel,
    this.isSubmitting = false,
  });

  final UserService? initial;
  final Future<bool> Function(Map<String, dynamic> fields) onSubmit;
  final String submitLabel;
  final bool isSubmitting;

  @override
  State<ServiceForm> createState() => _ServiceFormState();
}

class _ServiceFormState extends State<ServiceForm> {
  final _formKey = GlobalKey<FormState>();

  late final TextEditingController _nameCtrl;
  late final TextEditingController _priceCtrl;
  late final TextEditingController _notesCtrl;
  late final TextEditingController _clientNameCtrl;
  late final TextEditingController _clientPhoneCtrl;
  late final TextEditingController _clientEmailCtrl;
  late final TextEditingController _clientAddressCtrl;

  late String _type;
  late String _deliveryType;
  late String _serviceRole;
  late String _schedule;
  late String _iconName;
  late int _billingDay;
  late int _billingMonth;
  late bool _autoGenerateBill;
  late bool _active;
  DateTime? _startDate;
  DateTime? _endDate;

  static const _typeOptions = ['daily', 'weekly', 'monthly', 'yearly'];
  static const _deliveryTypeOptions = [
    ('home_delivery', 'Home Delivery'),
    ('utility', 'Utility'),
    ('visit_based', 'Visit Based'),
    ('subscription', 'Subscription'),
    ('payment', 'Payment'),
  ];

  static const _scheduleOptions = [
    'morning',
    'afternoon',
    'evening',
    'night',
    'all-day',
  ];

  static const _featuredIcons = [
    'coffee',
    'newspaper',
    'car',
    'utensils',
    'zap',
    'wifi',
    'droplets',
    'home',
    'package',
    'bike',
    'dumbbell',
    'flame',
    'tv',
    'phone',
    'heart-pulse',
    'wrench',
    'music',
    'book-open',
    'bus',
    'credit-card',
    'banknote',
    'building-2',
    'star',
  ];

  static const _monthOptions = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  String _normalizeSchedule(String value) {
    if (value == 'anytime') return 'all-day';
    if (_scheduleOptions.contains(value)) return value;
    return 'morning';
  }

  @override
  void initState() {
    super.initState();
    final s = widget.initial;
    _nameCtrl = TextEditingController(text: s?.name ?? '');
    _priceCtrl = TextEditingController(
      text: s != null ? s.price.toStringAsFixed(2) : '20.00',
    );
    _notesCtrl = TextEditingController(text: s?.notes ?? '');
    _clientNameCtrl = TextEditingController(text: s?.clientName ?? '');
    _clientPhoneCtrl = TextEditingController(text: s?.clientPhone ?? '');
    _clientEmailCtrl = TextEditingController(text: s?.clientEmail ?? '');
    _clientAddressCtrl = TextEditingController(text: s?.clientAddress ?? '');

    _type = s?.type ?? 'daily';
    _deliveryType = s?.deliveryType ?? 'home_delivery';
    _serviceRole = s?.serviceRole ?? 'consumer';
    _schedule = _normalizeSchedule(s?.schedule ?? 'morning');
    _iconName = s?.iconName ?? 'package';
    _billingDay = s?.billingDay ?? DateTime.now().day;
    _billingMonth = s?.billingMonth ?? DateTime.now().month;
    _autoGenerateBill = s?.autoGenerateBill ?? true;
    _active = s?.active ?? true;
    _startDate = s?.startDate?.toDate();
    _endDate = s?.endDate?.toDate();
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _priceCtrl.dispose();
    _notesCtrl.dispose();
    _clientNameCtrl.dispose();
    _clientPhoneCtrl.dispose();
    _clientEmailCtrl.dispose();
    _clientAddressCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final sectionLabelStyle = AppTextStyles.label.copyWith(
      color: Theme.of(context).colorScheme.onSurfaceVariant,
      letterSpacing: 0.35,
      fontWeight: FontWeight.w700,
    );

    return Form(
      key: _formKey,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(14, 10, 14, 120),
        children: [
          Text('SERVICE NAME', style: sectionLabelStyle),
          const SizedBox(height: 8),
          TextFormField(
            controller: _nameCtrl,
            decoration: InputDecoration(
              hintText: 'e.g., Netflix, Rent, Electricity',
              filled: true,
              fillColor: const Color(0xFFF4F5F7),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(999),
                borderSide: BorderSide.none,
              ),
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 18,
                vertical: 14,
              ),
            ),
            textInputAction: TextInputAction.next,
            validator: (value) {
              if (value == null || value.trim().isEmpty) {
                return 'Service name is required';
              }
              return null;
            },
          ),
          const SizedBox(height: 18),
          Text('SELECT ROLE', style: sectionLabelStyle),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: _RoleSelectorCard(
                  title: 'Consumer',
                  icon: LucideIcons.user,
                  selected: _serviceRole == 'consumer',
                  onTap: () => setState(() => _serviceRole = 'consumer'),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _RoleSelectorCard(
                  title: 'Provider',
                  icon: LucideIcons.store,
                  selected: _serviceRole == 'provider',
                  onTap: () => setState(() => _serviceRole = 'provider'),
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),

          if (_serviceRole == 'provider') ...[
            Text('CLIENT DETAILS', style: sectionLabelStyle),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFFF0FDF4),
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: const Color(0xFFBBF7D0)),
              ),
              child: Column(
                children: [
                  TextFormField(
                    controller: _clientNameCtrl,
                    decoration: InputDecoration(
                      labelText: 'Client Name',
                      hintText: 'e.g. Rahul Sharma',
                      prefixIcon: const Icon(LucideIcons.user, size: 18),
                      filled: true,
                      fillColor: Colors.white,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(14),
                        borderSide: BorderSide.none,
                      ),
                    ),
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: TextFormField(
                          controller: _clientPhoneCtrl,
                          keyboardType: TextInputType.phone,
                          decoration: InputDecoration(
                            labelText: 'Phone',
                            hintText: '9876543210',
                            prefixIcon:
                                const Icon(LucideIcons.phone, size: 18),
                            filled: true,
                            fillColor: Colors.white,
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(14),
                              borderSide: BorderSide.none,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: TextFormField(
                          controller: _clientEmailCtrl,
                          keyboardType: TextInputType.emailAddress,
                          decoration: InputDecoration(
                            labelText: 'Email',
                            hintText: 'client@example.com',
                            prefixIcon:
                                const Icon(LucideIcons.mail, size: 18),
                            filled: true,
                            fillColor: Colors.white,
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(14),
                              borderSide: BorderSide.none,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  TextFormField(
                    controller: _clientAddressCtrl,
                    decoration: InputDecoration(
                      labelText: 'Address',
                      hintText: 'Optional client address',
                      prefixIcon: const Icon(LucideIcons.mapPin, size: 18),
                      filled: true,
                      fillColor: Colors.white,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(14),
                        borderSide: BorderSide.none,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 18),
          ],

          // ── SERVICE TYPE ──────────────────────────────────────────────────
          Text('SERVICE TYPE', style: sectionLabelStyle),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _deliveryTypeOptions.map((opt) {
              final (value, label) = opt;
              final selected = _deliveryType == value;
              final icon = _deliveryTypeIcon(value);
              return GestureDetector(
                onTap: () => setState(() => _deliveryType = value),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 180),
                  padding: const EdgeInsets.symmetric(
                      horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    color: selected ? AppColors.primary : Colors.white,
                    borderRadius: BorderRadius.circular(999),
                    border: selected
                        ? null
                        : Border.all(
                            color: const Color(0xFFACB3B7).withOpacity(0.35)),
                    boxShadow: selected
                        ? null
                        : const [
                            BoxShadow(
                              color: Color(0x0A2D3337),
                              blurRadius: 8,
                              offset: Offset(0, 2),
                            )
                          ],
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(icon,
                          size: 14,
                          color: selected
                              ? Colors.white
                              : const Color(0xFF596063)),
                      const SizedBox(width: 6),
                      Text(
                        label,
                        style: AppTextStyles.bodySm.copyWith(
                          color: selected
                              ? Colors.white
                              : const Color(0xFF2D3337),
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 18),

          // ── FREQUENCY ─────────────────────────────────────────────────────
          Text('FREQUENCY', style: sectionLabelStyle),
          const SizedBox(height: 8),
          Row(
            children: _typeOptions.map((t) {
              final selected = _type == t;
              return Expanded(
                child: GestureDetector(
                  onTap: () => setState(() => _type = t),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 180),
                    margin: const EdgeInsets.only(right: 6),
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    decoration: BoxDecoration(
                      color: selected ? AppColors.primary : Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: selected
                          ? null
                          : Border.all(
                              color:
                                  const Color(0xFFACB3B7).withOpacity(0.35)),
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      _capitalize(t),
                      style: AppTextStyles.bodySm.copyWith(
                        color: selected
                            ? Colors.white
                            : const Color(0xFF2D3337),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 18),

          // ── BILLING DATE ──────────────────────────────────────────────────
          Text('BILLING DATE', style: sectionLabelStyle),
          const SizedBox(height: 8),
          if (_type == 'yearly') ...[
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: List.generate(_monthOptions.length, (index) {
                final month = index + 1;
                final selected = _billingMonth == month;
                return GestureDetector(
                  onTap: () => setState(() => _billingMonth = month),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 150),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 8,
                    ),
                    decoration: BoxDecoration(
                      color: selected ? AppColors.primary : Colors.white,
                      borderRadius: BorderRadius.circular(999),
                      border: selected
                          ? null
                          : Border.all(
                              color:
                                  const Color(0xFFACB3B7).withOpacity(0.35),
                            ),
                    ),
                    child: Text(
                      _monthOptions[index],
                      style: AppTextStyles.bodySm.copyWith(
                        color: selected ? Colors.white : const Color(0xFF2D3337),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                );
              }),
            ),
            const SizedBox(height: 12),
          ],
          Container(
            padding: const EdgeInsets.all(AppSpacing.sm),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x0A2D3337),
                  blurRadius: 12,
                  offset: Offset(0, 3),
                ),
              ],
            ),
            child: Wrap(
              spacing: 6,
              runSpacing: 6,
              children: List.generate(28, (i) {
                final day = i + 1;
                final selected = _billingDay == day;
                return GestureDetector(
                  onTap: () => setState(() => _billingDay = day),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 150),
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: selected
                          ? AppColors.primary
                          : const Color(0xFFF4F5F7),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      '$day',
                      style: AppTextStyles.bodySm.copyWith(
                        color:
                            selected ? Colors.white : const Color(0xFF2D3337),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                );
              }),
            ),
          ),
          const SizedBox(height: 18),

          // ── SCHEDULE ──────────────────────────────────────────────────────
          Text('SCHEDULE', style: sectionLabelStyle),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [..._scheduleOptions, 'custom'].map((s) {
              final selected = _schedule == s;
              return GestureDetector(
                onTap: () => setState(() => _schedule = s),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 150),
                  padding: const EdgeInsets.symmetric(
                      horizontal: 14, vertical: 8),
                  decoration: BoxDecoration(
                    color: selected ? AppColors.primary : Colors.white,
                    borderRadius: BorderRadius.circular(999),
                    border: selected
                        ? null
                        : Border.all(
                            color:
                                const Color(0xFFACB3B7).withOpacity(0.35)),
                  ),
                  child: Text(
                    _capitalize(s),
                    style: AppTextStyles.bodySm.copyWith(
                      color: selected
                          ? Colors.white
                          : const Color(0xFF2D3337),
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 18),

          // ── SERVICE PERIOD ────────────────────────────────────────────────
          Text('SERVICE PERIOD', style: sectionLabelStyle),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: _DatePickerButton(
                  label: 'Start Date',
                  date: _startDate,
                  onPick: () async {
                    final picked = await showDatePicker(
                      context: context,
                      initialDate: _startDate ?? DateTime.now(),
                      firstDate: DateTime(2000),
                      lastDate: DateTime(2100),
                    );
                    if (picked != null) {
                      setState(() => _startDate = picked);
                    }
                  },
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _DatePickerButton(
                  label: 'End Date',
                  date: _endDate,
                  onPick: () async {
                    final picked = await showDatePicker(
                      context: context,
                      initialDate: _endDate ?? DateTime.now(),
                      firstDate: DateTime(2000),
                      lastDate: DateTime(2100),
                    );
                    if (picked != null) {
                      setState(() => _endDate = picked);
                    }
                  },
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),

          // ── CHOOSE ICON ───────────────────────────────────────────────────
          Text('CHOOSE ICON', style: sectionLabelStyle),
          const SizedBox(height: 8),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: _featuredIcons
                .map(
                  (name) => _IconChip(
                    icon: ServiceIcons.fromName(name),
                    selected: _iconName == name,
                    onTap: () => setState(() => _iconName = name),
                  ),
                )
                .toList(),
          ),
          const SizedBox(height: 18),
                  Text(_type == 'yearly' ? 'YEARLY AMOUNT' : 'MONTHLY AMOUNT', style: sectionLabelStyle),
          const SizedBox(height: 8),
          TextFormField(
            controller: _priceCtrl,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            decoration: InputDecoration(
              hintText: 'e.g. 15.49',
              prefixText: '₹  ',
              filled: true,
              fillColor: const Color(0xFFF4F5F7),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(999),
                borderSide: BorderSide.none,
              ),
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 18,
                vertical: 14,
              ),
            ),
            validator: (value) {
              final parsed = double.tryParse(value ?? '');
              if (parsed == null || parsed <= 0) {
                return 'Enter a valid amount';
              }
              return null;
            },
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _StatusCard(
                  icon: LucideIcons.alarmClock,
                  title: 'REMINDERS',
                  value: _active ? '2 Days Before' : 'Disabled',
                  active: _active,
                  onTap: () => setState(() => _active = !_active),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _StatusCard(
                  icon: LucideIcons.badgeCheck,
                  title: 'AUTO-PAY',
                  value: _autoGenerateBill ? 'Enabled' : 'Disabled',
                  active: _autoGenerateBill,
                  onTap: () =>
                      setState(() => _autoGenerateBill = !_autoGenerateBill),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _notesCtrl,
            maxLines: 2,
            decoration: InputDecoration(
              hintText: 'Optional notes for billing context',
              filled: true,
              fillColor: const Color(0xFFF4F5F7),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: BorderSide.none,
              ),
            ),
          ),
          const SizedBox(height: 20),
          FilledButton(
            onPressed: widget.isSubmitting ? null : _submit,
            style: FilledButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              minimumSize: const Size.fromHeight(54),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(999),
              ),
            ),
            child: widget.isSubmitting
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation(Colors.white),
                    ),
                  )
                : Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(LucideIcons.checkCircle2, size: 16),
                      const SizedBox(width: 8),
                      Text(
                        widget.submitLabel,
                        style: const TextStyle(fontWeight: FontWeight.w700),
                      ),
                    ],
                  ),
          ),
        ],
      ),
    );
  }

  static IconData _deliveryTypeIcon(String type) {
    switch (type) {
      case 'home_delivery':
        return LucideIcons.package;
      case 'utility':
        return LucideIcons.zap;
      case 'visit_based':
        return LucideIcons.mapPin;
      case 'subscription':
        return LucideIcons.repeat;
      case 'payment':
        return LucideIcons.creditCard;
      default:
        return LucideIcons.circle;
    }
  }

  static String _capitalize(String s) =>
      s.isEmpty ? s : s[0].toUpperCase() + s.substring(1).replaceAll('-', ' ');

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    final clientName = _clientNameCtrl.text.trim();
    final clientPhone = _clientPhoneCtrl.text.trim();
    final clientEmail = _clientEmailCtrl.text.trim();
    final clientAddress = _clientAddressCtrl.text.trim();

    if (_serviceRole == 'provider') {
      if (clientName.isEmpty) {
        context.showErrorSnackBar('Client name is required for provider services');
        return;
      }
      if (clientPhone.isEmpty && clientEmail.isEmpty) {
        context.showErrorSnackBar('Add a client phone number or email');
        return;
      }
    }

    if (_startDate != null && _endDate != null && _startDate!.isAfter(_endDate!)) {
      context.showErrorSnackBar('Start date must be before end date');
      return;
    }

    final fields = <String, dynamic>{
      'name': _nameCtrl.text.trim(),
      'type': _type,
      'price': double.parse(_priceCtrl.text.trim()),
      'schedule': _type == 'yearly' ? 'all-day' : _schedule,
      'icon': _iconName,
      'delivery_type': _deliveryType,
      'service_role': _serviceRole,
      'billing_day': _billingDay,
      'billing_month': _type == 'yearly' ? _billingMonth : 1,
      'auto_generate_bill': _autoGenerateBill,
      'active': _active,
      'client_name': clientName.isEmpty ? null : clientName,
      'client_phone': clientPhone.isEmpty ? null : clientPhone,
      'client_email': clientEmail.isEmpty ? null : clientEmail,
      'client_address': clientAddress.isEmpty ? null : clientAddress,
      'notes': _notesCtrl.text.trim().isEmpty ? null : _notesCtrl.text.trim(),
      'start_date': _startDate?.toDateString(),
      'end_date': _endDate?.toDateString(),
    };

    final ok = await widget.onSubmit(fields);
    if (!mounted) return;
    if (ok) {
      context.showSnackBar('Service saved successfully');
    } else {
      context.showErrorSnackBar('Unable to save service');
    }
  }
}

class _RoleSelectorCard extends StatelessWidget {
  const _RoleSelectorCard({
    required this.title,
    required this.icon,
    required this.selected,
    required this.onTap,
  });

  final String title;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(22),
      child: Ink(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 14),
        decoration: BoxDecoration(
          color: selected ? const Color(0xFFEEF1FF) : Colors.white,
          borderRadius: BorderRadius.circular(22),
          border: selected
              ? Border.all(color: AppColors.primary, width: 1.5)
              : null,
          boxShadow: selected
              ? null
              : const [
                  BoxShadow(
                    color: Color(0x0A2D3337),
                    blurRadius: 16,
                    offset: Offset(0, 4),
                  ),
                ],
        ),
        child: Column(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: selected ? AppColors.primary : const Color(0xFFDDE4F8),
                shape: BoxShape.circle,
              ),
              child: Icon(
                icon,
                size: 16,
                color: selected ? Colors.white : Theme.of(context).colorScheme.onSurface,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              title,
              style: AppTextStyles.bodySm.copyWith(
                color: Theme.of(context).colorScheme.onSurface,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _IconChip extends StatelessWidget {
  const _IconChip({
    required this.icon,
    required this.selected,
    required this.onTap,
  });

  final IconData icon;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(999),
      child: Container(
        width: 48,
        height: 48,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: selected ? const Color(0xFFEEF1FF) : Colors.white,
          border: selected
              ? Border.all(color: AppColors.primary, width: 1.5)
              : null,
          boxShadow: selected
              ? null
              : const [
                  BoxShadow(
                    color: Color(0x0A2D3337),
                    blurRadius: 12,
                    offset: Offset(0, 3),
                  ),
                ],
        ),
        alignment: Alignment.center,
        child: Icon(
          icon,
          size: 17,
          color: selected ? AppColors.primary : Theme.of(context).colorScheme.onSurfaceVariant,
        ),
      ),
    );
  }
}

class _StatusCard extends StatelessWidget {
  const _StatusCard({
    required this.icon,
    required this.title,
    required this.value,
    required this.active,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String value;
  final bool active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(18),
      child: Ink(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: active ? const Color(0xFFEEF1FF) : Colors.white,
          borderRadius: BorderRadius.circular(18),
          border: active
              ? Border.all(color: AppColors.primary.withOpacity(0.4), width: 1.2)
              : null,
          boxShadow: active
              ? null
              : const [
                  BoxShadow(
                    color: Color(0x0A2D3337),
                    blurRadius: 16,
                    offset: Offset(0, 4),
                  ),
                ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(
              icon,
              size: 15,
              color: active ? AppColors.primary : Theme.of(context).colorScheme.onSurfaceVariant,
            ),
            const SizedBox(height: 8),
            Text(
              title,
              style: AppTextStyles.labelSm.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              value,
              style: AppTextStyles.bodySm.copyWith(
                color: Theme.of(context).colorScheme.onSurface,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _DatePickerButton extends StatelessWidget {
  const _DatePickerButton({
    required this.label,
    required this.date,
    required this.onPick,
  });

  final String label;
  final DateTime? date;
  final VoidCallback onPick;

  @override
  Widget build(BuildContext context) {
    final hasDate = date != null;
    return GestureDetector(
      onTap: onPick,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
              color: const Color(0xFFACB3B7).withOpacity(0.35)),
        ),
        child: Row(
          children: [
            Icon(LucideIcons.calendar,
                size: 16,
                color: hasDate ? AppColors.primary : const Color(0xFF596063)),
            const SizedBox(width: 8),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: AppTextStyles.labelSm.copyWith(
                      color: const Color(0xFF596063),
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  Text(
                    hasDate
                        ? '${date!.day}/${date!.month}/${date!.year}'
                        : 'Not set',
                    style: AppTextStyles.bodySm.copyWith(
                      color: hasDate
                          ? const Color(0xFF2D3337)
                          : const Color(0xFFACB3B7),
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
