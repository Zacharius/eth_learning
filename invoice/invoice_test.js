var Invoice = artifacts.require('invoice.sol')

var acct1 = "0x19fBD692F46Ecad339b4d0d74DC3B4981409D057"

module.exports = function(callback) {
    Invoice.deployed().then(function(instance) {

	return instance.call();
    }).then(function(name){
	console.log(name.toString());
	console.log('success!?')
    }).catch(function(e) {
	console.log(e.toString());
	console.log('Failure');
    });
	    
};
