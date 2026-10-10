import { pairsFormat } from './pairs.jsx';

export default pairsFormat({
  min: 3,
  max: 20,
  maxLen: 60,
  noun: 'pair',
  placeholders: ['Cats', 'Dogs'],
  makerHint: 'Two things go head to head, over and over. After each pick, players see how everyone else voted.',
  titlePlaceholder: 'Pick one: 2000s snacks edition',
  shareText: (game) => `I did "${game.title}". Let's see if you pick the same:`,
});
