// Contains core sorceryjs configuration

var config = {
  
  debuglevel : 1,
  
  // list installed bundles here
  bundles : [
    'imports/sorcery'
  ],
  
  // per-environment settings, will override general ones if overlap
  env : {
    
    // production environment
    prod : {
      debuglevel : 1,
    },
  
    // development environment
    dev : {
      debug_level : 3,
      
      security : {
        allowed_clients : [ '127.0.0.1' ]
      }
    }
    
  },
  
  // which environment to load by default
  default_env : 'dev',
  
};

module.exports=config;