pragma solidity ^0.4.0;

contract invoice {

  address public originator;
  address public payer;
  uint public og_owed;
  uint public owed;
  string public invoice_name;

  uint public refund = 0;
  uint public collected = 0;

  

  constructor(
	      string _invoice_name,
	      address _payer,
	      uint _amount_owed
	      )public {
    originator = msg.sender;
    payer = _payer;
    invoice_name = _invoice_name;
    owed = _amount_owed;
    og_owed = owed;
  }

  function pay() public payable {

    //payment must be from deptor
    require(
	    msg.sender == payer,
	    'This weight is not yours to bear');


    if(msg.value > owed) {
      refund = msg.value - owed;
      collected = owed;
      owed = 0;
    }else {
      collected += msg.value;
      owed -= msg.value;
    }



   }


  function collect() public {
    if (msg.sender == originator &&
	collected > 0) {
      uint amount = collected;
      collected = 0;
      originator.transfer(amount);
    }

    if (msg.sender == payer &&
	refund > 0) {
      amount = refund;
      refund = 0;
      payer.transfer(amount);
    }
  }

   
}


	      
