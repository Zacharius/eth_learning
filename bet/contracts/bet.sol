pragma solidity >= 0.5.0;


contract Bet {
  address public initiator;
  address public challenged;
  address[] public judges;

  enum Vote { Null, Initiator, Challenged, Hung }
  mapping(address => Vote) public votes;

  string public bet_name;

  uint public bet;
  uint public matched = 0;

  //number between 0 and 100, inclusive
  //decides vote threshold needed to declare winner
  uint public threshold;

  uint public owed_initiator = 0;
  uint public owed_challenged = 0;

  //times expressed as seconds since unix epoch
  uint public creation_time = now;
  uint public judgement_deadline;
  uint public confirmation_deadline = creation_time + 1 days;

  event Voted(address judge, Vote vote);
  event stateChange(State state);
  event Owed(address owed, uint amount);
  event Test(uint t);

  enum State { Confirmation, Judgement, Complete }
  State public state;

  enum Conclusion { Undecided, Initiator, Challenger, Hung }
  Conclusion public winstate = Conclusion.Undecided;

  //check the time to ensure we are in the correct state
  modifier checkState {
    uint time = now;

    if (time > confirmation_deadline && state==State.Confirmation) {
      state = State.Judgement;
      emit stateChange(state);
    }

    if (time > judgement_deadline && state==State.Judgement) {
      state = State.Complete;
      emit stateChange(state);
    }

    _;
      
  }

  constructor (string memory _bet_name,
	      address _challenged,
	      address[] memory _judges,
	      uint _threshold,
	      uint _deadline) public payable {

    require(_deadline > confirmation_deadline,
	    'deadline must be more than 24 hours into the future');
    
    require(_threshold <= 100,
	    'threshold cant be greater than 100');

    require (_judges.length >= 1,
	     'There must be atleast 1 judge');
    
    bet_name = _bet_name;
    bet = msg.value;
    challenged = _challenged;
    initiator = msg.sender;
    threshold = _threshold;
    judgement_deadline = _deadline;
    judges = _judges;

    for(uint i=0; i<_judges.length; i++) {
      votes[_judges[i]] = Vote.Hung;
    }

    state = State.Confirmation;
    emit stateChange(state);
  }

  //allow challenged to match bet of initiator
  function matchBet() public payable checkState {

    require(msg.sender == challenged,
	    'you have not been challenged');
    require(state == State.Confirmation,
	    'We are not in the confirmation stage');

    matched += msg.value;

    if(matched > bet) {
      owed_challenged = matched - bet;
      emit Owed(challenged, owed_challenged);
      matched = bet;
    }

    if(matched == bet) {
      state = State.Judgement;
      emit stateChange(state);
    }
  }

  //allow initiator and challenged to collect any owed amount
  function collect() public checkState {
    uint amount = 0;

    if(msg.sender == challenged &&
       owed_challenged > 0){
      amount = owed_challenged;
      owed_challenged = 0;
      msg.sender.transfer(amount);
    }

    if(msg.sender == initiator &&
       owed_initiator > 0){
      amount = owed_initiator;
      owed_initiator= 0;
      msg.sender.transfer(amount);
    }
  }


  //allow initiator or challenged to retract bet during confirmation
  function retract() public checkState {
    require(msg.sender == initiator || msg.sender == challenged,
	    'you cannot retract this bet');
    require(state == State.Confirmation,
	    'it is too late to turn back');

    state = State.Complete;
    winstate = Conclusion.Hung;
    emit stateChange(state);

    owed_initiator = bet;
    if(owed_initiator > 0){
      emit Owed(initiator, owed_initiator);
    }

    owed_challenged = matched;
    if(owed_challenged > 0){
      emit Owed(challenged, owed_challenged);
    }
  }

  //allow judges to vote
  function castVote(uint int_vote) public checkState {
    require(votes[msg.sender] != Vote.Null,
	    'Only judges can vote');
    require(state == State.Judgement,
	    'It is not yet the time of reckoning');

    Vote vote = Vote(int_vote);

    votes[msg.sender] = vote;
    emit Voted(msg.sender, vote);
  }

  function conclude() public checkState {
    require(state == State.Complete,
	    'Your fate is still being decided on');
    require(winstate == Conclusion.Undecided,
	    'This contract has concluded');
    
    uint init_votes = 0;
    uint chall_votes = 0;

    bool init_threshold = false;
    bool chall_threshold = false;

    for(uint i=0; i<judges.length; i++){
      if(votes[judges[i]] == Vote.Initiator) {
	init_votes += 1;
      }
      else if(votes[judges[i]] == Vote.Challenged){
	chall_votes += 1;
      }
    }

    emit Test(init_votes);
    emit Test(chall_votes);

    if( (init_votes/judges.length) > (threshold/100) ){
      init_threshold = true;
    }

    if( (chall_votes/judges.length) > (threshold/100) ){
      chall_threshold = true;
    }

    if(init_threshold != chall_threshold){
      if(init_threshold == true) {
	winstate = Conclusion.Initiator;
	owed_initiator += bet*2;
      }else if(chall_threshold == true) {
	winstate = Conclusion.Challenger;
	owed_challenged += bet*2;
      }
    }else{
      winstate = Conclusion.Hung;
      owed_initiator += bet;
      owed_challenged += bet;
    }

    state = State.Complete;

    emit Owed(initiator,owed_initiator);
    emit Owed(challenged, owed_challenged);
    emit stateChange(state);

  }

  //force change state, for testing purposes only
  //ensure is commentted out before deploying contract for realsies
  function changeState(State _state) public {
    state = _state;
  }

  

}
