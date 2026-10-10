import { pairsFormat } from './pairs.jsx';

export default pairsFormat({
  min: 3,
  max: 15,
  maxLen: 120,
  noun: 'question',
  big: true,
  prompt: 'would you rather…',
  placeholders: ['Only eat cereal forever', 'Never eat cereal again'],
  makerHint: 'Two scenarios, both a bit cursed. Players pick one and find out who else would make the same call.',
  titlePlaceholder: 'Would you rather: holiday from hell edition',
  shareText: (game) => `I did "${game.title}" and I have no regrets. What would you pick?`,
});
