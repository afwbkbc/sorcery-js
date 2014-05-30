Sorcery.define([
  'class/library',
],function(Library){

  Sorcery.require_environment(Sorcery.ENVIRONMENT_CLI);
  
  return Library.extend({
    
    fs : require('fs'),
    
    list_directory : function(path) {
      return this.fs.readdirSync(path);
    },
    
  });
  
});