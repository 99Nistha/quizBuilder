import blindRanking from './blindRanking.jsx';
import thisOrThat from './thisOrThat.jsx';
import wouldYouRather from './wouldYouRather.jsx';
import poll from './poll.jsx';
import trivia from './trivia.jsx';
import personality from './personality.jsx';
import tierList from './tierList.jsx';
import bracket from './bracket.jsx';

// Each format provides: blank(), check(data), Editor, Player, Result, shareText(game, result)
export const formatUI = {
  blind_ranking: blindRanking,
  this_or_that: thisOrThat,
  would_you_rather: wouldYouRather,
  poll,
  trivia,
  personality,
  tier_list: tierList,
  bracket,
};
