pragma solidity >= 0.5.0;

import './bet.sol';

interface Judge {

  enum Vote { Null, Initiator, Challenged, Hung }

  function castVote (Bet toContract) external returns (Vote vote);
}
