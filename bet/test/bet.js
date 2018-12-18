var Bet = artifacts.require('Bet');

 
contract('bet', async (accounts) => {

    var initiator = accounts[0];
    var challenged = accounts[1];
    var judges = [8];
    

    for(let i=2; i<accounts.length; i++) {
	judges[i-2] = accounts[i];
    }



    var bet_name = 'test';
    var amount = web3.utils.toWei('1', 'ether');
    var threshold = 30;
    var deadline = new Date('2019-12-16T14:10:00').getTime() / 1000;

    var inst;

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
	
	inst = await Bet.new(bet_name,
			     challenged,
			     judges,
			     threshold,
			     deadline,
			     {from: initiator, value: amount});
    });

    it('cant construct contract with deadline in past', async function() {
	var bad_deadline = new Date('2017-12-14T14:10:00').getTime() / 1000;

	try{
	     await Bet.new(bet_name,
			   challenged,
			   judges,
			   threshold,
			   bad_deadline);
	}catch(e) {
	    assert.ok(1);
	    return;
	}
	assert.fail();
    });

    it('cant construct contract with threshold greater than 100', async function() {
	var bad_threshold = 120;
	
	try{
	     await Bet.new(bet_name,
			   challenged,
			   judges,
			   bad_threshold,
			   deadline);
	}catch(e) {
	    assert.ok(1);
	    return;
	}
	assert.fail();
    });

    it('properly set constructor variables', async () => {
	let _bet_name = await inst.bet_name.call();
	let _bet = await inst.bet.call();
	let _challenged = await inst.challenged.call();
	let _threshold = await inst.threshold.call();
	let _deadline = await inst.judgement_deadline.call();

	assert.equal(_bet_name.valueOf(), bet_name);
	assert.equal(_bet.valueOf(), amount);
	assert.equal(_challenged.valueOf(), challenged);
	assert.equal(_threshold.valueOf(), threshold);
	assert.equal(_deadline.valueOf(), deadline);

	for (var i=0; i<judges.length; i++){
	    let vote = await inst.votes.call(judges[i]);
	    assert.equal(vote.valueOf(), Vote.Hung);
	}
    });

    it('challenged can confirm bet through payment', async () => {
	await inst.matchBet({from: challenged, value: amount});

	let state = await inst.state.call();
	let matched = await inst.matched.call();

	assert.equal(state.valueOf(), State.Judgement);
	assert.equal(matched.valueOf(), amount);

    });

    it('challenged can make partial payments', async () => {
	let payment1 = amount/2;
	let payment2 = amount - payment1;
	
	await inst.matchBet({from: challenged, value: payment1});

	let state = await inst.state.call();
	let matched = await inst.matched.call();

	assert.equal(state.valueOf(), State.Confirmation);
	assert.equal(matched.valueOf(), payment1);

	await inst.matchBet({from: challenged, value: payment2});

	state = await inst.state.call();
	matched = await inst.matched.call();

	assert.equal(state.valueOf(), State.Judgement);
	assert.equal(matched.valueOf(), amount);


    });

    it('challenged can get refund if he overpays', async () => {
	
	let old_bal= await web3.eth.getBalance(challenged);
	
	await inst.matchBet({from: challenged, value: (amount*2)});

	let state = await inst.state.call();
	let matched = await inst.matched.call();

	assert.equal(state.valueOf(), State.Judgement);
	assert.equal(matched.valueOf(), amount);

	await inst.collect({from: challenged});

	let new_bal = await web3.eth.getBalance(challenged);

	assert.ok(checkDiff(old_bal, new_bal, amount*-1));
    });

    it('initiator can retract bet during confirmation phase', async () => {

	let old_bal= await web3.eth.getBalance(initiator);
	
	await inst.retract({from: initiator});
	await inst.collect({from: initiator});

	let new_bal = await web3.eth.getBalance(initiator);
	let state = await inst.state.call();

	assert.equal(state.valueOf(), State.Complete);
	assert.ok(checkDiff(old_bal, new_bal, amount));
    });

    it('challenged can retract bet during confirmation phase', async () => {

	let old_bal= await web3.eth.getBalance(challenged);
	
	await inst.matchBet({from: challenged, value: (amount/2)});
	await inst.retract({from: challenged});
	await inst.collect({from: challenged});

	let new_bal = await web3.eth.getBalance(challenged);
	let state = await inst.state.call();

	assert.equal(state.valueOf(), State.Complete);
	assert.ok(checkDiff(old_bal, new_bal, 0));
    });

    it('non-judges cant vote ', async () => {
	await inst.changeState(State.Judgement);

	try {
	    await inst.castVote(Vote.Challenged, {from: initiator});
	}catch(e){
	    assert.ok(1);
	    return;
	}

	assert.fail();
    });

    it('judges can cast vote during judgement phase', async () => {
	await inst.changeState(State.Judgement);

	await inst.castVote(Vote.Challenged, {from: judges[0]});
	await inst.castVote(Vote.Initiator, {from: judges[1]});
	await inst.castVote(Vote.Hung, {from: judges[2]});

	let v1 = await inst.votes.call(judges[0]);
	let v2 = await inst.votes.call(judges[1]);
	let v3 = await inst.votes.call(judges[2]);

	assert.equal(v1.valueOf(), Vote.Challenged);
	assert.equal(v2.valueOf(), Vote.Initiator);
	assert.equal(v3.valueOf(), Vote.Hung);
    });

    it('initator wins with enough votes', async () => {
	await inst.matchBet({from: challenged, value: amount});
			    

	for(let i=0; i<judges.length; i++){
	    await inst.castVote(Vote.Initiator, {from: judges[i]});
	}

	await inst.changeState(State.Complete);
	await inst.conclude();

	let winstate = await inst.winstate.call();
	let state = await inst.state.call();

	assert.equal(winstate.valueOf(), Conclusion.Initiator);
	assert.equal(state.valueOf(), State.Complete);

	let old_bal = await web3.eth.getBalance(initiator);
	await inst.collect({from: initiator});
	let new_bal = await web3.eth.getBalance(initiator);

	assert.ok(checkDiff(old_bal, new_bal, amount*2));
	
    });

    it('challenger wins with enough votes', async () => {
	await inst.matchBet({from: challenged, value: amount});
			    

	for(let i=0; i<judges.length; i++){
	    await inst.castVote(Vote.Challenged, {from: judges[i]});
	}

	await inst.changeState(State.Complete);
	await inst.conclude();

	let winstate = await inst.winstate.call();
	let state = await inst.state.call();

	assert.equal(winstate.valueOf(), Conclusion.Challenged);
	assert.equal(state.valueOf(), State.Complete);

	let old_bal = await web3.eth.getBalance(challenged);
	await inst.collect({from: challenged});
	let new_bal = await web3.eth.getBalance(challenged);

	assert.ok(checkDiff(old_bal, new_bal, amount*2));
	
    });

    it('if neither party gets enough votes, no one wins', async () => {
	await inst.matchBet({from: challenged, value: amount});
			    
	await inst.changeState(State.Complete);
	await inst.conclude();

	let winstate = await inst.winstate.call();
	let state = await inst.state.call();

	assert.equal(winstate.valueOf(), Conclusion.Hung);
	assert.equal(state.valueOf(), State.Complete);

	let old_bal = await web3.eth.getBalance(initiator);
	await inst.collect({from: initiator});
	let new_bal = await web3.eth.getBalance(initiator);

	assert.ok(checkDiff(old_bal, new_bal, amount));
	
	old_bal = await web3.eth.getBalance(challenged);
	await inst.collect({from: challenged});
	new_bal = await web3.eth.getBalance(challenged);

	assert.ok(checkDiff(old_bal, new_bal, amount));
    });

    it('if both parties gets enough votes, no one wins', async () => {
	await inst.matchBet({from: challenged, value: amount});
			    
	for(let i=0; i<judges.length/2; i++){
	    await inst.castVote(Vote.Initiator, {from: judges[i]});
	}

	for(let i=judges.length/2; i<judges.length; i++){
	    await inst.castVote(Vote.Challenged, {from: judges[i]});
	}

	await inst.changeState(State.Complete);
	await inst.conclude();

	let winstate = await inst.winstate.call();
	let state = await inst.state.call();

	assert.equal(winstate.valueOf(), Conclusion.Hung);
	assert.equal(state.valueOf(), State.Complete);

	let old_bal = await web3.eth.getBalance(initiator);
	await inst.collect({from: initiator});
	let new_bal = await web3.eth.getBalance(initiator);

	assert.ok(checkDiff(old_bal, new_bal, amount));

	old_bal = await web3.eth.getBalance(challenged);
	await inst.collect({from: challenged});
	new_bal = await web3.eth.getBalance(challenged);

	assert.ok(checkDiff(old_bal, new_bal, amount));
	

    });



    function checkDiff(old, nu, expect) {
	var diff = nu - old;
	maxgas = web3.utils.toWei('16000000', 'gwei');

	if (diff <= expect && diff >= (expect-maxgas)){
	    return true;
	}else {
	    return false;
	}
    }
});
