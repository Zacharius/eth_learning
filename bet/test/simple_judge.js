var Simple_Judge = artifacts.require('Simple_Judge');
var Bet = artifacts.require('Bet');

contract('simple_judge', function(accounts) {
    var initiator = accounts[0];
    var challenged = accounts[1];
    
    var bet_name = 'bet';
    var amount = web3.utils.toWei('1', 'ether');
    var threshold = 100;
    var deadline = new Date('2019-12-16T14:10:00').getTime() / 1000;

    var bet_inst;
    var judge_inst;

    var Vote = {
	Initiator: 1,
	Challenged: 2,
	Hung: 3
    };

    var State = {
	Confirmation: 0,
	Judgement: 1,
	Complete: 2
    };

    var Conclusion = {
	Undecided: 0,
	Initiator: 1,
	Challenged: 2,
	Hung: 3
    };
    
    beforeEach ( async function()  {
	
	judge_inst = await Simple_Judge.new();
	
	bet_inst = await Bet.new(bet_name,
			     challenged,
			     [judge_inst.address],
			     threshold,
			     deadline,
			     {from: initiator, value: amount});
    });

    it('judge will send vote to contract', async function() {

	await bet_inst.matchBet({from: challenged, value: amount});

	for(var i=0; i<10; i++){
	    await judge_inst.castVote(bet_inst.address);
	    var _vote = await bet_inst.votes.call(judge_inst.address);
	}
	

	assert.ok(_vote.toString() !=  Vote.Hung);
    });

});
