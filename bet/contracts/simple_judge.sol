pragma solidity 0.5.0;

import './judge_interface.sol' ;
import './bet.sol' ;


contract Simple_Judge is Judge {

  function castVote(Bet bet_contract) external returns (Vote vote) {
    vote = Vote.Hung;
    //uint uvote = vote;//send enum as uint to avoid conversion error
    bet_contract.castVote(uint(vote));
    return vote;
  }
  
}
