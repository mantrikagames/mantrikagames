# ==============================================================================
# Mantrika Games — Pallanguzhi (Traditional Mancala): GDScript Rules Engine
# ==============================================================================
class_name PallanguzhiRules
extends RefCounted

const NUM_PITS: int = 14
const SEEDS_PER_PIT: int = 5

var pits: Array[int] = [] # 14 pits (0-6 Player 1, 7-13 Player 2)
var stores: Dictionary = { 0: 0, 1: 0 }
var current_turn: int = 0
var winner: int = -1

func init_game() -> void:
	pits.clear()
	for i in range(NUM_PITS):
		pits.append(SEEDS_PER_PIT)
	stores = { 0: 0, 1: 0 }
	current_turn = 0
	winner = -1
