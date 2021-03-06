module.exports = function(socketio, Backbone, _){

  return Backbone.ServerView.extend({    
    
    initialize :  function () {

      if(!this.collection){
        console.log("APIView can't access to the collection");
      }

      this.collection.on('add', this.add, this);
      this.collection.on('remove', this.remove, this);
      this.collection.on('change', this.change, this);
      this.collection.on('change:_id', this.changeID, this);
      this.collection.on('all', this.all, this);

      //Init socket listners
      this.main = socketio.of('/main');
      this.main.on('connection', function (socket) {
        //politeness
        socket.emit('news', "hello you !");
        socket.broadcast.emit('news', "new user connected");

      });

      socketio.of('/create').on('connection', _.bind(function(socket){
        socket.on('ask', _.bind(
          function (obj){
            this.collection.create(obj, function (result) {
              socket.emit('answer', result);
            });
          }, {collection: this.collection})
        );
      },this));
      
      socketio.of('/read').on('connection', _.bind(function(socket){
        socket.on('ask', _.bind(
          function (query){
            socket.emit('answer', this.collection.toJSON());
          }, {collection: this.collection})
        );
      },this));

      socketio.of('/update').on('connection',_.bind(function(socket){
        socket.on('ask', _.bind(
          function (query){
            var m = this.collection.get(query._id);
            m.set(query)
            m.save();
          }, this) 
        )
      },this));

      socketio.of('/delete').on('connection',_.bind(function(socket){
        socket.on('ask', _.bind(
          function (query){
            var m = this.collection.get(query);
            m.destroy();
            this.collection.remove(m);
          }, this) 
        );
      },this));
    },
    
    all : function(event, model, collection){
      console.log(event);
    },

    changeID: function(model, id){
      this.main.emit("change:_id", model.toJSON());
    },

    change: function(model, collection){
      this.main.emit("change", model.toJSON());
    },

    add: function(model, collection){
      this.main.emit("add", model.toJSON());
    },

    remove: function(model, collection){
      this.main.emit("remove", model.toJSON());
    }

  });

}; 