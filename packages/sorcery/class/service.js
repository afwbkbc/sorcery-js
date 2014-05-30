Sorcery.define([
  'class/class'
],function(Class){
  var service=function() {
      console.log('SERVICEFUNC',Class);
  };
  console.log('SERVICE',Class);
  return service;
});