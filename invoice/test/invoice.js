var Invoice = artifacts.require('invoice')

contract('invoice', async (accounts) => {
    var acct1 = accounts[0];
    var acct2 = accounts[1];
    var acct3 = accounts[2];
    
    var invoice_name = 'test';
    var amount = web3.toWei(5, 'ether');
    var collected = 0;
    var refund = 0;
    


    let inst;

    beforeEach(async function() {
	inst = await Invoice.new(invoice_name, acct2, amount, {from: acct3});
    });

    it('will properly set amount owed, name, debtor, originator', async () => {
	let owed = await inst.owed.call();
	let name = await inst.invoice_name.call();
	let debtor = await inst.payer.call();
	let origin = await inst.originator.call();

	assert.equal(owed.valueOf(), amount);
	assert.equal(name.toString(), invoice_name);
	assert.equal(debtor.valueOf(), acct2);
	assert.equal(origin.valueOf(), acct3);
    });

    it('will not accept payment from anyone but payer', async () => {
	let pay = web3.toWei(1, 'ether')
	try {
	    await inst.pay({from: acct1, value: pay});
	} catch(e) {
	    assert.ok(1);
	}

	assert.ok(-1);
    });
	
    it('contract will increment owed, collected upon payment', async () => {
	let pay = web3.toWei(1, 'ether')
	await inst.pay({from: acct2, value: pay});
	let owed = await inst.owed.call();
	collected = await inst.collected.call();
	assert.equal(owed.valueOf(), amount-pay);
	assert.equal(collected.valueOf(), pay);
    });

     it('will allow originator to collect payment', async () => {
	 let pay = web3.toWei(1, 'ether')
	 await inst.pay({from: acct2, value: pay});

	 collected = await inst.collected.call();
	 assert.equal(collected.valueOf(), pay);

	 let original_amount = await web3.eth.getBalance(acct3);
	 await inst.collect({from: acct3});
	 let new_amount = await web3.eth.getBalance(acct3);

	 let diff = new_amount - original_amount;
	 let max_gas = web3.toWei(.1, 'ether');

	 assert.ok((diff <= pay) && (diff >= (pay - max_gas)));

	 collected = await inst.collected.call();
	 assert.equal(collected.valueOf(), 0);

    });

    it('will allow originator and debtor to collect payment/refund', async () => {
	 let pay = web3.toWei(6, 'ether')
	 await inst.pay({from: acct2, value: pay});

	 collected = await inst.collected.call();
	 assert.equal(collected.valueOf(), amount);

	refund = await inst.refund.call()
	assert.equal(refund.valueOf(), pay-amount);

	 let org_origin_amt = await web3.eth.getBalance(acct3);
	 await inst.collect({from: acct3});
	 let new_origin_amt = await web3.eth.getBalance(acct3);

	 let diff = new_origin_amt - org_origin_amt;
	 let max_gas = web3.toWei(.1, 'ether');

	assert.ok((diff <= collected.valueOf())
		  && (diff >= (collected.valueOf() - max_gas)));

	 let org_debtor_amt = await web3.eth.getBalance(acct2);
	 await inst.collect({from: acct2});
	 let new_debtor_amt = await web3.eth.getBalance(acct2);

	diff = new_debtor_amt - org_debtor_amt;
	
	assert.ok((diff <= refund.valueOf())
		  && (diff >= (refund.valueOf() - max_gas)));



	 collected = await inst.collected.call();
	refund = await inst.refund.call();
	owed = await inst.owed.call();
	
	 assert.equal(collected.valueOf(), 0);
	 assert.equal(refund.valueOf(), 0);
	 assert.equal(owed.valueOf(), 0);

	

    });





    
/*    it('contract will accept payments from payer', async function() {
	inst = await inv;
	
	var pay = web3.toWei(1, 'ether');
	ret = await inst.pay({from: acct2, val: pay});
	owed = await inst.owed.call();
	collected = await inst.collected.call();

	amount = amount - pay;

	console.log(ret)
	console.log(amount);
	console.log(owed);
	console.log(collected);
	assert.equal(amount, owed.toString());
	assert.equal(pay, collected.toString());
	/*return inv.all([

	    function(inst) {
		inst.pay({from: acct2, val:100});
		return inst.owed.call();
	    },
	    function(inst) {
		return inst.refund.call();
	    }])
	.then(function(owed, collected) {
	    console.log(owed);
	    assert.ok((amount-100 == owed) &&
		      (collected == 100));
	});
    });*/

	
	    

    
});





	
