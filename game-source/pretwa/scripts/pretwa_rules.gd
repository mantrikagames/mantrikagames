# ==============================================================================
# Mantrika Games — Pretwa (Bihar Circular Mandala): GDScript Rules Engine
# ==============================================================================
class_name PretwaRules
extends RefCounted

const TOTAL_PIECES: int = 9
const NUM_NODES: int = 19

# 19 Nodes:
# Node 0: Center (0,0)
# Nodes 1-6: Inner Ring (radius 1, angles 0, 60, 120, 180, 240, 300)
# Nodes 7-12: Middle Ring (radius 2, same angles)
# Nodes 13-18: Outer Ring (radius 3, same angles)
var board: Array = [] # 19 nodes, values: -1 (empty), 0 (Player 1), 1 (Player 2)
var turn: int = 0
var winner: int = -1

func init_game() -> void:
	board.clear()
	# Center node 0 starts empty (-1)
	board.append(-1)
	# South half: 9 pieces (Player 0)
	# North half: 9 pieces (Player 1)
	for i in range(1, 10): board.append(0)
	for i in range(10, 19): board.append(1)
	turn = 0
	winner = -1
