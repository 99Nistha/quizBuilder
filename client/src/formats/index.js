import blindRanking from './blindRanking.jsx';
import thisOrThat from './thisOrThat.jsx';
import wouldYouRather from './wouldYouRather.jsx';

// Each format provides: blank(), check(data), Editor, Player, Result, shareText(game, result)
export const formatUI = {
  blind_ranking: blindRanking,
  this_or_that: thisOrThat,
  would_you_rather: wouldYouRather,
};
