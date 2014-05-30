Sorcery.initialize(function(){
  
  Sorcery.require([
    'service/router',
  ],function(Router){
    
    console.log('HERE',Router,(new Error).stack);
    
    //Router.initialize();
    
  });
  
});