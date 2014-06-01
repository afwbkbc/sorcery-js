Sorcery.define([
  'class/command',
  'service/fs',
],function(Command,Fs){
  
  return Command.extend({
    
    run : function() {
      var filedata='';
      
      var getcache = function(extensions) {
        if (typeof(extensions)==='string')
          extensions=[extensions];
        // parse bundles and generate path cache
        var pathcache={};
        var paths=Sorcery.get_require_paths();
        for (var i in paths) {
          var path=paths[i];
          var files=Fs.list_directory_recursive(path);
          for (var ii in files) {
            var f=files[ii].substring(path.length+1);
            if (f.length>3) {
              for (var iii in extensions) {
                var ext=extensions[iii];
                var ei=f.indexOf(ext);
                var fl=f.length;
                var el=ext.length;
                var flel=fl-el;
                if ((ei>=0)&&(ei===flel)) {
                  f=f.substring(0,flel);
                  if (typeof(pathcache[f])==='undefined')
                    pathcache[f]=path;
                }
              }
            }
          }
        }
        return pathcache;
      };
      
      var pathcache={
          js:getcache('.js'),
      };
      
      for (var i in Sorcery.template_engines)
        pathcache[i]=getcache(Sorcery.template_engines[i]);
      
      //console.log('PC',pathcache);
      
      filedata+='Sorcery.set_path_cache('+JSON.stringify(pathcache)+');';
      
      // other
      
      Fs.write_file('cache.js',filedata);
    },
    
    description : function() {
      return '(re)generate cache.js file';
    },
    
  });
  
});