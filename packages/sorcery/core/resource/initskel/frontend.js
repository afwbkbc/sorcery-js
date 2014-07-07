Sorcery.require([
  'service/router',
  'app/controller/*',
],function(Router){
  
  Router.initialize([].splice.call(arguments,1));
  
});
