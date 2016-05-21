
var Logger = React.createClass({
  render: function(){
    return <button className= 'twit' onClick = {this.props.clicka}>{this.props.texta}</button>
  }
})

var Searcher =  React.createClass({
  focus: function(){

    if (this.refs.title.value === 'City name') {
      this.refs .title.value = "";
    }
  },
  blur: function(){
    if (this.refs.title.value === '') {
      this.refs.title.value = "City name";
    }
  },
  render: function(){
    return  <div>
              <input onSubmit ={this.props.searcher} id = "cityyelp" ref = "title" className = 'linker' onFocus = {this.focus} onBlur = {this.blur} defaultValue = "City name"></input>
              <button onClick = {this.props.searcher}>Search</button>
            </div>
  }
});

var Main =  React.createClass({
getInitialState: function(){
     return {
            places: this.props.place,
            activePlaces: this.props.users,  //list for each bar
            logged:false,           
            city: this.props.city,    
            votes: this.props.votes  //list of list same indexed as  users 
            }
},
handleLog: function(){
  if (this.state.logged){
    this.setState({logged: false});
  } else{
     self = this;
       var win = window.open('/twitter', "windowname1", 'width=800, height=600'); 
       var logTimer = window.setInterval(function() { 
                    if (win.document.body.textContent) {
                        window.clearInterval(logTimer);
                        self.setState({logged: JSON.parse(win.document.body.textContent).name});
                        win.close();
                    }
            }, 500);
  }
},
handleGo: function(ind){
  var updateMod;
  if (!this.state.logged) {
    alert('Please log in...');
    return;
  }
  var tempPlaces = this.state.activePlaces.slice();
  var tempGoers = this.state.votes.slice();
  var bar = this.state.places[ind];
  var indexas = tempPlaces.indexOf(bar.barname);
  if (indexas === -1) {
    tempPlaces.push(bar.barname);
    tempGoers.push([this.state.logged]);
    updateMod = 'yes';
  } else{
    if (tempGoers[indexas].indexOf(this.state.logged) === -1) {
    tempGoers[indexas].push(this.state.logged);
   updateMod = 'yes';
  }else{
    var removeInd = tempGoers[indexas].indexOf(this.state.logged);
    tempGoers[indexas].splice(removeInd, 1);
    updateMod = 'no';
  }
  }
this.setState({
    activePlaces: tempPlaces,
    votes: tempGoers
});
$.get( "/vote", {city: this.state.city , place: bar.barname, user: this.state.logged, adder: updateMod});
},

handleSearch: function(){
  var self = this;
    $.get( "/search", {city: document.querySelector("#cityyelp").value})
            .done(function( data ) {
              if (data.data){
                alert ('YELP: '+ JSON.parse(data.data).error.text);
              } else{
                  self.setState({
                      activePlaces: data.voters.votedBars,
                      places: data.places,
                      city:  data.city,
                      votes: data.voters.votes
                 });
                 
              }
    })
},
render: function(){
    
    var logText,
        goingNumber;
    if (!this.state.logged){
      logText ='Log in with Twitter';
    }else{
      logText ='Log out';
    }
    return <div>
            <Logger texta = {logText} clicka = {this.handleLog}/>
            <Searcher searcher = {this.handleSearch}/>

            {this.state.places.map((listValue, index)=>{
                          
                          goingNumber = 0;
                          var checkIndex = this.state.activePlaces.indexOf(listValue.barname);
                          if (checkIndex !==-1) {
                            goingNumber = this.state.votes[checkIndex].length;
                          }
                          return <div>
                                  <div ><p className = "bar header"> <span>{listValue.barname}</span></p></div>
                                  <div className= 'rd'>
                                    <img className= "bars" src={listValue.image}/>
                                    <button className= "goers" onClick={()=> this.handleGo(index)}>Going: {goingNumber}</button>
                                    <div className = "barbody">{listValue.description}</div>
                                  </div>
                                  </div>
            })}
          </div>
}
});

ReactDOM.render(<Main place = {[]} users = {[]} votes = {[]} city = ""/>, document.querySelector("#main") );