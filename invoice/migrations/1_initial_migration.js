var Migrations = artifacts.require("./Migrations.sol");
var invoice = artifacts.require("./invoice.sol");

module.exports = function(deployer) {
    deployer.deploy(Migrations);

    var name = 'test';
    var address = 0xf56B6ea6771229B351A963D2A0624E88C8cd61a0;
    var amount = 500;

    
    deployer.deploy(invoice, name, address, amount );

};
