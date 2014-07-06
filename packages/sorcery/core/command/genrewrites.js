Sorcery.define([
  'class/command',
  'service/fs',
  'controller/*',
],function(Command,Fs){
  
  var controllers=arguments;
  
  return Command.extend({
    
    run : function() {
      
      var routemasks=[];
      
      var pseudo_router={
        
        route : function(data) {
          var pattern=data.pattern;
          var pos;
          while ((pos=pattern.indexOf(':'))>=0) {
            var subpattern=pattern.substring(pos);
            var pos2=subpattern.indexOf('/');
            if (pos2>=0)
              subpattern=subpattern.substring(0,pos2);
            pattern=pattern.replace(subpattern,'([^/]+)');
          }
          routemasks.push(pattern);
        }
        
      };
      
      for (var i in controllers) {
        var c=controllers[i];
        if (c.class_name==='controller')
          c.register(pseudo_router);
      }
      
      var string='RewriteEngine on\n';
      for (var i in routemasks)
        string+='RewriteRule ^'+routemasks[i]+'$ sorcery.html [QSA,L]\n';
      
      Fs.write_file('./.htaccess',string);
    },
    
    description : function() {
      return 'update .htaccess with currently enable routes';
    }
    
  });
  
});