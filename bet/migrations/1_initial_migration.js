var Migrations = artifacts.require("./Migrations.sol");
var Bet = artifacts.require("Bet");

module.exports = function(deployer, accounts) {
    deployer.deploy(Migrations);

    /*var initiator = accounts[0];
    var challenged = accounts[1];
    var judges = [];

    for(let i=2; i<accounts.length; i++) {
	judges[i-2] = accounts[i];
    }


    var bet_name = 'test';
    var amount = web3.toWei(5, 'ether');
    var threshold = 80;
    var deadline = new Date('2018-12-14T14:10:00').getTime() / 1000;
    console.log(deadline);

    deployer.deploy(Bet, bet_name, amount, challenged, judges, threshold, deadline);*/


};
