# ==============================================================================
# Mantrika Games — Chowka Bara: Automated Headless Unit Tests
# ==============================================================================
extends RefCounted

func run_tests() -> bool:
	print("--- Running Chowka Bara Rule Engine Tests ---")
	var passed = true
	passed = passed and test_initial_state()
	passed = passed and test_cowrie_scoring_logic()
	passed = passed and test_outer_loop_movement()
	passed = passed and test_capture_and_inner_loop_unlock()
	passed = passed and test_safe_zones_prevent_capture()
	passed = passed and test_exact_roll_to_win()
	
	if passed:
		print(">>> ALL CHOWKA BARA RULE TESTS PASSED! <<<")
	else:
		printerr(">>> SOME CHOWKA BARA RULE TESTS FAILED! <<<")
	return passed

func test_initial_state() -> bool:
	var rules = ChowkaBaraRules.new()
	rules.init_game(2)
	assert(rules.active_players.size() == 2, "Must have 2 active players")
	assert(rules.pawns[0].size() == 4, "Player 0 must have 4 pawns")
	assert(rules.has_captured[0] == false, "Player 0 must not have captured initially")
	print("[PASS] Initial State Test")
	return true

func test_cowrie_scoring_logic() -> bool:
	var rules = ChowkaBaraRules.new()
	rules.init_game(2)
	for i in range(20):
		var res = rules.roll_cowries()
		assert(res.score in [1, 2, 3, 4, 8], "Roll must be valid value")
		if res.score == 4 or res.score == 8:
			assert(res.bonus_roll == true, "4 and 8 must grant bonus rolls")
	print("[PASS] Cowrie Scoring Test")
	return true

func test_outer_loop_movement() -> bool:
	var rules = ChowkaBaraRules.new()
	rules.init_game(2)
	var moves = rules.get_legal_moves(0, 3)
	assert(moves.size() == 4, "All 4 pawns should have legal move for roll 3")
	assert(moves[0]["to_step"] == 3, "Pawn 0 should advance to step 3")
	print("[PASS] Outer Loop Movement Test")
	return true

func test_capture_and_inner_loop_unlock() -> bool:
	var rules = ChowkaBaraRules.new()
	rules.init_game(2)
	# Setup Player 0 pawn at step 1 and Player 2 pawn at step 3 (which maps to (0, 0) for both)
	# Player 0 step 10 is (0, 0), Player 2 step 2 is (0, 0)
	rules.pawns[0][0] = 7 # P0 step 7 is (0, 3)
	rules.pawns[2][0] = 2 # P2 step 2 is (0, 0)
	
	# P0 moves 3 steps to (0, 0) [step 10]
	var moves = rules.get_legal_moves(0, 3)
	var cap_move = {}
	for m in moves:
		if m["pawn_idx"] == 0:
			cap_move = m
			break
			
	assert(cap_move.is_capture == true, "Must detect capture on unsafe square")
	var res = rules.apply_move(0, cap_move)
	assert(res.is_capture == true, "Capture executed")
	assert(rules.has_captured[0] == true, "Inner loop unlocked for Player 0")
	assert(rules.pawns[2][0] == 0, "Captured pawn sent back to base")
	print("[PASS] Capture and Inner Loop Unlock Test")
	return true

func test_safe_zones_prevent_capture() -> bool:
	var rules = ChowkaBaraRules.new()
	rules.init_game(2)
	# Player 2 pawn at North Home (0, 2) which is safe Katta
	rules.pawns[2][0] = 0 # Step 0 for P2 is (0, 2)
	rules.pawns[0][0] = 6 # Step 6 for P0 is (0, 4)
	# Moving 2 steps reaches (0, 2) which is safe!
	var moves = rules.get_legal_moves(0, 2)
	var p0_move = moves[0]
	assert(p0_move.is_capture == false, "Safe square must prevent capture")
	print("[PASS] Safe Zone Sanctuary Test")
	return true

func test_exact_roll_to_win() -> bool:
	var rules = ChowkaBaraRules.new()
	rules.init_game(2)
	rules.has_captured[0] = true
	rules.pawns[0] = [23, 24, 24, 24] # 3 pawns at Ghar, 1 pawn at step 23
	
	var moves_for_2 = rules.get_legal_moves(0, 2)
	assert(moves_for_2.is_empty(), "Roll of 2 should overshoot step 24 and be illegal")
	
	var moves_for_1 = rules.get_legal_moves(0, 1)
	assert(moves_for_1.size() == 1, "Roll of 1 should be legal")
	assert(moves_for_1[0]["reaches_ghar"] == true, "Step 24 reaches Ghar")
	
	rules.apply_move(0, moves_for_1[0])
	assert(rules.winner == 0, "Player 0 wins the game!")
	print("[PASS] Exact Roll to Win Test")
	return true
