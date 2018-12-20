pragma solidity 0.5.0;

import './judge_interface.sol' ;
import './bet.sol' ;
import "./oraclizeAPI.sol";


contract Simple_Judge is Judge{


  function castVote(Bet bet_contract) external returns (Vote vote) {
    if (block.timestamp % 2 == 0){
      vote = Vote.Initiator;
    }
    else {
      vote = Vote.Challenged;
    }
    bet_contract.castVote(uint(vote));
    return vote;
  }

}
