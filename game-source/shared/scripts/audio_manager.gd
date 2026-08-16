# ==============================================================================
# Mantrika Games — Shared Audio Manager
# ==============================================================================
class_name SharedAudioManager
extends Node

enum SfxType {
	DICE_ROLL,
	DICE_SETTLE,
	PIECE_SELECT,
	PIECE_MOVE,
	PIECE_PLACE,
	PIECE_CAPTURE,
	SAFE_HOUSE,
	TURN_NOTIFICATION,
	VICTORY,
	UI_CLICK
}

var sound_enabled: bool = true

func play_sfx(type: SfxType, _pitch_scale: float = 1.0) -> void:
	if not sound_enabled:
		return
	# Audio playback triggers here for sampled/synthesized sounds
	# In Web/Native export, this interfaces with AudioStreamPlayer3D or procedural generator

func set_sound_enabled(enabled: bool) -> void:
	sound_enabled = enabled
