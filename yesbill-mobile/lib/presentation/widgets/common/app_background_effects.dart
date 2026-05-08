import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../../../core/theme/app_colors.dart';

/// Animated ambient glow orbs — used on both the app shell and auth/onboarding
/// screens to keep a consistent visual background across all surfaces.
class AppBackgroundEffects extends StatelessWidget {
  const AppBackgroundEffects({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return IgnorePointer(
      child: RepaintBoundary(
        child: Stack(
          fit: StackFit.expand,
          children: [
            Positioned(
              top: -130,
              left: -110,
              child: _GlowOrb(
                size: 300,
                color: isDark
                    ? AppColors.primary.withOpacity(0.26)
                    : AppColors.primary.withOpacity(0.18),
                begin: const Offset(-10, -6),
                end: const Offset(20, 16),
                duration: 7.seconds,
              ),
            ),
            Positioned(
              bottom: -160,
              right: -90,
              child: _GlowOrb(
                size: 340,
                color: isDark
                    ? const Color(0xFF60A5FA).withOpacity(0.18)
                    : const Color(0xFF60A5FA).withOpacity(0.14),
                begin: const Offset(8, 8),
                end: const Offset(-18, -12),
                duration: 9.seconds,
              ),
            ),
            Align(
              alignment: const Alignment(0.1, -0.25),
              child: _GlowOrb(
                size: 180,
                color: isDark
                    ? const Color(0xFFA78BFA).withOpacity(0.14)
                    : const Color(0xFFA78BFA).withOpacity(0.1),
                begin: const Offset(0, -8),
                end: const Offset(0, 10),
                duration: 8.seconds,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// [_GlowOrb] is a [StatefulWidget] so it owns its [AnimationController].
/// Using a [StatelessWidget] with `flutter_animate`'s `onPlay` here caused
/// the controller to restart on every parent rebuild (e.g. theme change),
/// because each `build()` created a new `onPlay` closure that
/// `Animate.didUpdateWidget` treated as "changed".  Restarting the controller
/// mid-frame while the render tree was also being updated triggered the
/// `removeRenderObjectChild: renderObject.child == child` assertion in
/// Flutter's `SingleChildRenderObjectElement`.
class _GlowOrb extends StatefulWidget {
  const _GlowOrb({
    required this.size,
    required this.color,
    required this.begin,
    required this.end,
    required this.duration,
  });

  final double size;
  final Color color;
  final Offset begin;
  final Offset end;
  final Duration duration;

  @override
  State<_GlowOrb> createState() => _GlowOrbState();
}

class _GlowOrbState extends State<_GlowOrb>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: widget.duration)
      ..repeat(reverse: true);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final orb = Container(
      width: widget.size,
      height: widget.size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: RadialGradient(
          colors: [
            widget.color,
            widget.color.withOpacity(0.45),
            widget.color.withOpacity(0.0),
          ],
          stops: const [0.0, 0.5, 1.0],
        ),
      ),
    );

    // Pass the stable controller — no onPlay callback, so didUpdateWidget
    // will never restart the animation when the parent rebuilds.
    return orb
        .animate(controller: _controller)
        .move(
            begin: widget.begin,
            end: widget.end,
            curve: Curves.easeInOut)
        .scale(
          begin: const Offset(0.96, 0.96),
          end: const Offset(1.07, 1.07),
          curve: Curves.easeInOut,
        )
        .fade(begin: 0.72, end: 0.94, curve: Curves.easeInOut);
  }
}
