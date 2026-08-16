/**
 * Headless Automated Unit Test Suite for Chowka Bara Rule Engine
 */
const assert = require('assert');

// 5x5 Grid Definition & Safe Cells
const SAFE_CELLS = [
  { r: 4, c: 2 }, // South (Player 0)
  { r: 2, c: 4 }, // East (Player 1)
  { r: 0, c: 2 }, // North (Player 2)
  { r: 2, c: 0 }, // West (Player 3)
  { r: 2, c: 2 }  // Central Ghar
];

const PLAYER_PATHS = {
  0: [
    {r:4,c:2}, {r:4,c:3}, {r:4,c:4}, {r:3,c:4},
    {r:2,c:4}, {r:1,c:4}, {r:0,c:4}, {r:0,c:3},
    {r:0,c:2}, {r:0,c:1}, {r:0,c:0}, {r:1,c:0},
    {r:2,c:0}, {r:3,c:0}, {r:4,c:0}, {r:4,c:1},
    {r:3,c:1}, {r:3,c:2}, {r:3,c:3}, {r:2,c:3},
    {r:1,c:3}, {r:1,c:2}, {r:1,c:1}, {r:2,c:1},
    {r:2,c:2}
  ],
  2: [
    {r:0,c:2}, {r:0,c:1}, {r:0,c:0}, {r:1,c:0},
    {r:2,c:0}, {r:3,c:0}, {r:4,c:0}, {r:4,c:1},
    {r:4,c:2}, {r:4,c:3}, {r:4,c:4}, {r:3,c:4},
    {r:2,c:4}, {r:1,c:4}, {r:0,c:4}, {r:0,c:3},
    {r:1,c:3}, {r:1,c:2}, {r:1,c:1}, {r:2,c:1},
    {r:3,c:1}, {r:3,c:2}, {r:3,c:3}, {r:2,c:3},
    {r:2,c:2}
  ]
};

function isCellSafe(r, c) {
  return SAFE_CELLS.some(sc => sc.r === r && sc.c === c);
}

function calculateLegalMoves(playerId, rollValue, pawnsState, hasCaptured) {
  const moves = [];
  const pawns = pawnsState[playerId];
  const canEnterInner = hasCaptured[playerId];

  pawns.forEach((currentStep, pawnIdx) => {
    if (currentStep >= 24) return; // already in Ghar

    let targetStep = currentStep + rollValue;

    if (!canEnterInner && targetStep > 15) {
      targetStep = targetStep % 16;
    }

    if (targetStep > 24) return;

    const path = PLAYER_PATHS[playerId];
    const toCoord = path[targetStep];
    const isSafe = isCellSafe(toCoord.r, toCoord.c);

    let isCapture = false;
    let oppData = null;

    if (!isSafe && targetStep < 24) {
      Object.keys(pawnsState).forEach(oppId => {
        if (parseInt(oppId, 10) === playerId) return;
        const oppPawns = pawnsState[oppId];
        oppPawns.forEach((oppStep, oppPawnIdx) => {
          if (oppStep < 24) {
            const oppCoord = PLAYER_PATHS[oppId][oppStep];
            if (oppCoord.r === toCoord.r && oppCoord.c === toCoord.c) {
              isCapture = true;
              oppData = { oppPlayer: parseInt(oppId, 10), oppPawnIdx };
            }
          }
        });
      });
    }

    moves.push({
      pawnIdx,
      fromStep: currentStep,
      toStep: targetStep,
      toCoord,
      isCapture,
      oppData,
      reachesGhar: (targetStep === 24)
    });
  });

  return moves;
}

console.log('>>> RUNNING CHOWKA BARA TEST SUITE <<<');

// 1. Test Initial Setup
const pawns = { 0: [0, 0, 0, 0], 2: [0, 0, 0, 0] };
const captured = { 0: false, 2: false };
const moves1 = calculateLegalMoves(0, 3, pawns, captured);
assert.strictEqual(moves1.length, 4, 'All 4 pawns should have legal moves');
assert.strictEqual(moves1[0].toStep, 3, 'Pawn should advance to step 3');
console.log('✓ Initial setup and movement test passed.');

// 2. Test Outer Loop Wrapping without Capture
pawns[0][0] = 14;
const movesWrap = calculateLegalMoves(0, 3, pawns, captured);
const mWrap = movesWrap.find(m => m.pawnIdx === 0);
assert.strictEqual(mWrap.toStep, (14 + 3) % 16, 'Should wrap around outer loop (step 1)');
console.log('✓ Outer loop wrapping without capture passed.');

// 3. Test Capture Mechanics and Safe Zone Protection
pawns[0][0] = 7; // (0, 3)
pawns[2][0] = 2; // (0, 0) - unsafe square
const movesCap = calculateLegalMoves(0, 3, pawns, captured);
const mCap = movesCap.find(m => m.pawnIdx === 0);
assert.strictEqual(mCap.isCapture, true, 'Should detect capture on (0, 0)');
assert.strictEqual(mCap.oppData.oppPlayer, 2, 'Captured player should be Player 2');
console.log('✓ Capture detection on unsafe squares passed.');

// 4. Test Safe Zone Protection
pawns[2][0] = 0; // (0, 2) - North Home Safe Katta
pawns[0][0] = 6; // (0, 4)
const movesSafe = calculateLegalMoves(0, 2, pawns, captured);
const mSafe = movesSafe.find(m => m.pawnIdx === 0);
assert.strictEqual(mSafe.isCapture, false, 'Safe zone must prevent capture');
console.log('✓ Safe zone protection passed.');

// 5. Test Inner Track Unlocking and Exact Roll to Win
captured[0] = true; // Player 0 has made a capture
pawns[0] = [23, 24, 24, 24]; // 3 pawns at Ghar (24), 1 pawn at step 23
const movesOvershoot = calculateLegalMoves(0, 2, pawns, captured);
assert.strictEqual(movesOvershoot.length, 0, 'Overshooting Ghar (23 + 2 = 25) must be illegal');

const movesWin = calculateLegalMoves(0, 1, pawns, captured);
assert.strictEqual(movesWin.length, 1, 'Exact roll of 1 should be legal');
assert.strictEqual(movesWin[0].reachesGhar, true, 'Exact roll of 1 reaches Ghar');
console.log('✓ Inner track unlock and exact roll to win passed.');

console.log('🎉 ALL 5 CHOWKA BARA RULE TESTS PASSED SUCCESSFULLY! 🎉');
