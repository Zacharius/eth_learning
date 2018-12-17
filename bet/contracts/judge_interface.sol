pragma solidity >= 0.5.0;

interface Judge {


  enum Vote { Null, Initiator, Challenged, Hung }

  function castVote (address cont) external returns (Vote) ;
}
