Sorcery.define([
  'class/command',
  'library/fs',
],function(Command,Fs){
  
  return Command.extend({
    
    run : function() {
      var filedata='';
      
      // parse bundles and generate path cache
      var pathcache={};
      var paths=Sorcery.get_require_paths();
      for (var i in paths) {
        var path=paths[i];
        var files=Fs.list_directory_recursive(path);
        for (var ii in files) {
          var f=files[ii].substring(path.length+1);
          if (f.length>3) {
            if (f.indexOf('\.js')===f.length-3) {
              f=f.substring(0,f.length-3);
              if (typeof(pathcache[f])==='undefined')
                pathcache[f]=path;
            }
          }
        }
      }
      
      filedata+='Sorcery.set_path_cache('+JSON.stringify(pathcache)+');';
      
      // other
      
      Fs.write_file('cache.js',filedata);
    },
    
    description : function() {
      return '(re)generate cache.js file';
    },
    
  });
  
});