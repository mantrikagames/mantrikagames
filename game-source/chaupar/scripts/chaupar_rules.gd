# ==============================================================================
# Mantrika Games — Chaupar: GDScript Rules & Joori Logic Engine
# ==============================================================================
class_name ChauparRules
extends RefCounted

# 3 Long Cubic Dice (Pasa): values on each die are 1, 2, 5, 6
static func roll_pasa() -> Array[int]:
	var values = [1, 2, 5, 6]
	return [
		values[randi() % 4],
		values[randi() % 4],
		values[randi() % 4]
	]

var num_players: int = 2
var active_players: Array[int] = [0, 2]
var pawns: Dictionary = {}

func init_game(p_count: int = 2) -> void:
	num_players = p_count
	active_players = [0, 2] if num_players == 2 else [0, 1, 2, 3]
	pawns.clear()
	for p in active_players:
		pawns[p] = [0, 0, 0, 0]
