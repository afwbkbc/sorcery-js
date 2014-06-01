Sorcery.define([
  'class/class',
  'service/fetcher',
],function(
    Class,
    Fetcher
){
  
  Sorcery.require_environment(Sorcery.ENVIRONMENT_WEB);
  
  return Class.extend({

    construct : Sorcery.method(function(me) {
      var sid=Sorcery.begin();

      var self=this;
      
      var init_html = function() {
      
        if (typeof(self.template)==='undefined')
          self.template=self.module_name.replace('view/','template/');
        
        var engine=null;
        
        // TODO: make dynamic
        var templatepath=null;
        for (var i in Sorcery.template_engines) {
          templatepath=Sorcery.resolve_path(self.template,i);
          if (templatepath!==null) {
            engine=i;
            break;
          }
        }
        if (templatepath===null)
          throw new Error('unable to find template "'+self.template+'"');
        else {
          templatepath+=Sorcery.template_engines[engine];
        }
        
        Fetcher.get_file(templatepath,function(content){
          console.log('CONTENT',content);
        });
      };
      
      init_html();
      
      /*Fetcher.get_file('templates/'+this.template+'.html.twig',function(content){
        console.log('CONTENT',content);
        return Sorcery.end(sid);
      });*/
      
    }),
    
    destroy : Sorcery.method(function() {
      var sid=Sorcery.begin();
      
      console.log('PARENT DESTROY');
      
      return Sorcery.end(sid);
    })
    
  });
});