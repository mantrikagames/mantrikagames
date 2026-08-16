# ==============================================================================
# Mantrika Games — Twelve Beads (Baro Guti): GDScript Rules Engine
# ==============================================================================
class_name TwelveBeadsRules
extends RefCounted

const TOTAL_BEADS: int = 12

var board: Array = [] # 25 nodes (0 to 24), values: -1 (empty), 0 (Player 1 Red), 1 (Player 2 Gold)
var turn: int = 0
var winner: int = -1

func init_game() -> void:
	board.clear()
	# First 12 nodes = Player 0 (Red)
	# Node 12 (center 2,2) = -1 (Empty)
	# Last 12 nodes = Player 1 (Gold)
	for i in range(12): board.append(0)
	board.append(-1)
	for i in range(12): board.append(1)
	turn = 0
	winner = -1
