import 'package:flutter/material.dart';

import 'widgets/service_month_tracker.dart';

class ServiceCalendarScreen extends StatelessWidget {
  const ServiceCalendarScreen({super.key, required this.serviceId});
  final String serviceId;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Service Calendar')),
      body: ServiceMonthTracker(initialServiceId: serviceId),
    );
  }
}
