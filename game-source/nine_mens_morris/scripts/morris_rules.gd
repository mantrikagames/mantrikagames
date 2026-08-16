# ==============================================================================
# Mantrika Games — Nine Men's Morris (Navakankari): GDScript Rules Engine
# ==============================================================================
class_name NineMensMorrisRules
extends RefCounted

const TOTAL_STONES: int = 9
const NUM_NODES: int = 24

# 24 Node Connections & Mills
# Outer square: 0,1,2 (top), 2,3,4 (right), 4,5,6 (bottom), 6,7,0 (left)
# Middle square: 8,9,10, 10,11,12, 12,13,14, 14,15,8
# Inner square: 16,17,18, 18,19,20, 20,21,22, 22,23,16
# Cross connectors: (1,9,17), (3,11,19), (5,13,21), (7,15,23)
const MILLS: Array = [
	[0,1,2], [2,3,4], [4,5,6], [6,7,0],
	[8,9,10], [10,11,12], [12,13,14], [14,15,8],
	[16,17,18], [18,19,20], [20,21,22], [22,23,16],
	[1,9,17], [3,11,19], [5,13,21], [7,15,23]
]

var board: Array = [] # 24 nodes, values: -1 (empty), 0 (White/P1), 1 (Black/P2)
var unplaced_stones: Dictionary = { 0: 9, 1: 9 }
var turn: int = 0
var winner: int = -1

func init_game() -> void:
	board.clear()
	for i in range(NUM_NODES):
		board.append(-1)
	unplaced_stones = { 0: 9, 1: 9 }
	turn = 0
	winner = -1
