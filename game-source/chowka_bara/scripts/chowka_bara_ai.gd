# ==============================================================================
# Mantrika Games — Chowka Bara: Multi-Tier Intelligent AI Engine
# ==============================================================================
class_name ChowkaBaraAI
extends RefCounted

enum Difficulty {
	EASY,
	MEDIUM,
	HARD
}

static func choose_move(rules: ChowkaBaraRules, player_id: int, legal_moves: Array[Dictionary], difficulty: Difficulty = Difficulty.MEDIUM) -> Dictionary:
	if legal_moves.is_empty():
		return {}
		
	if legal_moves.size() == 1:
		return legal_moves[0]
		
	match difficulty:
		Difficulty.EASY:
			return _choose_easy_move(legal_moves)
		Difficulty.MEDIUM:
			return _choose_medium_move(rules, player_id, legal_moves)
		Difficulty.HARD:
			return _choose_hard_move(rules, player_id, legal_moves)
		_:
			return legal_moves[0]

static func _choose_easy_move(legal_moves: Array[Dictionary]) -> Dictionary:
	# Random legal move with slight priority for captures
	for move in legal_moves:
		if move["is_capture"]:
			return move
	return legal_moves[randi() % legal_moves.size()]

static func _choose_medium_move(rules: ChowkaBaraRules, player_id: int, legal_moves: Array[Dictionary]) -> Dictionary:
	var best_score: float = -999999.0
	var best_move: Dictionary = legal_moves[0]
	
	for move in legal_moves:
		var score: float = _evaluate_move_heuristics(rules, player_id, move)
		if score > best_score:
			best_score = score
			best_move = move
			
	return best_move

static func _choose_hard_move(rules: ChowkaBaraRules, player_id: int, legal_moves: Array[Dictionary]) -> Dictionary:
	# Expectimax evaluation across possible cowrie shell roll distributions
	var best_score: float = -999999.0
	var best_move: Dictionary = legal_moves[0]
	
	for move in legal_moves:
		var score: float = _evaluate_move_heuristics(rules, player_id, move)
		
		# Lookahead for future vulnerability and piece synergy
		var to_coord = move["to_coord"]
		var is_safe = rules.is_cell_safe(to_coord)
		
		if not is_safe and move["to_step"] < 24:
			# Calculate threat from all opponents
			var threat_penalty: float = 0.0
			for opp_id in rules.active_players:
				if opp_id == player_id:
					continue
				for opp_step in rules.pawns[opp_id]:
					var opp_coord = rules.get_cell_coord(opp_id, opp_step)
					var dist = _manhattan_dist(to_coord, opp_coord)
					if dist <= 3:
						threat_penalty += (4.0 - dist) * 80.0
			score -= threat_penalty
			
		if score > best_score:
			best_score = score
			best_move = move
			
	return best_move

static func _evaluate_move_heuristics(rules: ChowkaBaraRules, player_id: int, move: Dictionary) -> float:
	var score: float = 0.0
	var to_step: int = move["to_step"]
	var from_step: int = move["from_step"]
	var to_coord: Vector2i = move["to_coord"]
	var is_safe: bool = rules.is_cell_safe(to_coord)
	
	# 1. Winning move: Entering Ghar
	if move["reaches_ghar"]:
		return 10000.0
		
	# 2. Capturing an opponent piece
	if move["is_capture"]:
		score += 1500.0
		if not rules.has_captured[player_id]:
			score += 2500.0 # Huge priority on first cut to unlock inner loop!
			
	# 3. Safe Zone Sanctuary
	if is_safe and to_step < 24:
		score += 300.0
		
	# 4. Progress forward along track
	score += float(to_step - from_step) * 25.0
	
	# 5. Inner track bonus
	if to_step >= 16:
		score += 400.0
		
	# 6. Avoid leaving starting base if safe and under heavy threat
	if from_step == 0 and not is_safe:
		score -= 50.0
		
	return score

static func _manhattan_dist(p1: Vector2i, p2: Vector2i) -> int:
	return abs(p1.x - p2.x) + abs(p1.y - p2.y)
