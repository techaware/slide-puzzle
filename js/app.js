/** @jsx React.DOM */

(function () {

    var Game = React.createClass({

        render: function () {

            return (
                    <span id='game-board' className={this.props.id}>
                    {this.props.tiles.map(function (tile, position) {
                        return ( <Tile status={tile} id={position} tileClick={this.props.tileClick}/> );
                    }, this)}
                </span>
            );
        }
    });

    var Games = React.createClass({
        shuffle: function () {

            var startArray = [1, 2, 3, 4, 5, 6, 7, 8, ''];

            // switches first two tiles
            function switchTiles(array) {
                var i = 0;

                // find the first two tiles in a row
                while (!array[i] || !array[i + 1]) i++;

                // store tile value
                var tile = array[i];
                // switche values
                array[i] = array[i + 1];
                array[i + 1] = tile;

                return array;
            }

            // counts inversions
            function countInversions(array) {
                // make array of inversions
                var invArray = array.map(function (num, i) {
                    var inversions = 0;
                    for (j = i + 1; j < array.length; j++) {
                        if (array[j] && array[j] < num) {
                            inversions += 1;
                        }
                    }
                    return inversions;
                });
                // return sum of inversions array
                return invArray.reduce(function (a, b) {
                    return a + b;
                });
            }

            // fischer-yates shuffle algorithm
            function fischerYates(array) {
                var counter = array.length, temp, index;

                // While there are elements in the array
                while (counter > 0) {
                    // Pick a random index
                    index = Math.floor(Math.random() * counter);
                    // Decrease counter by 1
                    counter--;
                    // And swap the last element with it
                    temp = array[counter];
                    array[counter] = array[index];
                    array[index] = temp;
                }

                // array = [1,2,3,4,5,6,7,'',8];
                return array;
            }

            // Fischer-Yates shuffle
            var array = fischerYates(startArray);

            // check for even number of inversions
            if (countInversions(array) % 2 !== 0) {
                // switch two tiles if odd
                array = switchTiles(array);
            }

            return array;
        },

        getInitialState: function () {

            var initTiles = this.shuffle();
            this.props.userPrevStates = [initTiles];
            this.props.autoPrevStates = [initTiles];
            this.props.win = false;
            this.props.userWin = false;
            this.props.autoWin = false;
            return {
                // initial state of game board
                userTiles: initTiles,
                autoTiles: initTiles,
                autoSolve:false,
            };
        },
        checkBoard: function (tiles) {
            // var tiles = this.state.tiles;

            for (var i = 0; i < tiles.length - 1; i++) {
                if (tiles[i] !== i + 1) return false;
            }

            return true;
        },

        autoTileClick: function (auto) {

            //get element from position
            function findVacant(tiles) {
                for (var i = 0; i < tiles.length; i++) {
                    if (tiles[i] == '')return i;
                }
            };

            function getDistance(tPos, vPos, tiles) {
                //    find distance when tile is moved from tPos to vPos
                sTiles = [...tiles];
                sTiles[vPos] = tiles[tPos];
                sTiles[tPos] = '';
                //    distance matrix
                var ds = [
                    [0, 1, 2, 1, 2, 3, 2, 3, 4], [1, 0, 1, 2, 1, 2, 3, 2, 3], [2, 1, 0, 3, 2, 1, 4, 3, 2],
                    [1, 2, 3, 0, 1, 2, 1, 2, 3], [2, 1, 2, 1, 0, 1, 2, 1, 2], [3, 2, 1, 2, 1, 0, 3, 2, 1],
                    [2, 3, 4, 1, 2, 3, 0, 1, 2], [3, 2, 3, 2, 1, 2, 1, 0, 1], [4, 3, 2, 3, 2, 1, 2, 1, 0]
                ];

                var tDs = 0;
                var tVal = sTiles[vPos];
                // tDs = ds[tVal-1][vPos];
                for (var i = 0; i < sTiles.length; i++) {
                    var tVal = sTiles[i];
                    if (tVal != '') {
                        tDs = tDs + ds[tVal - 1][i];
                    }
                }

                return tDs;
            };

            function stateExists(tPos, vPos) {
                //    check if tile at tPos is moved to vPos then the new state was already observed
                var sTiles = [...tiles];
                sTiles[vPos] = tiles[tPos];
                sTiles[tPos] = '';

                for (var i = 0; i < prevStates.length; i++) {
                    if (prevStates[i].toString() == sTiles.toString())return true;
                }
            };
            function pickTileToMove(vPos) {
                // Possible moves to fill vacant
                var sTiles = [...tiles];
                var moves = [
                    [3, 1], [4, 0, 2], [5, 1],
                    [6, 0, 4], [1, 3, 5, 7], [8, 4, 2],
                    [3, 7], [6, 4, 8], [7, 5]
                ];
                var tDs = 100, pickTilePos;
                var newState = false;
                for (var i = 0; i < moves[vPos].length; i++) {
                    var tPos = moves[vPos][i];
                    // if an adjacent tile is empty
                    if (!stateExists(tPos, vPos)) {
                        newState = true;
                        var ds = getDistance(tPos, vPos, sTiles);
                        if (ds <= tDs) {
                            pickTilePos = tPos;
                            tDs = ds;
                        }
                    }
                }

                return {newState: newState, tPos: pickTilePos, tDs: tDs};

            };
            function isEqual(a, b) {
                if (a != null && b == null)return false
                if (a == null && b != null)return false
                if (a.toString() != b.toString())return false
                return true
            };

            function pickTileToMoveWithDepth(vPos, depth, sTiles, prevTiles) {
                // Possible moves to fill vacant
                var moves = [
                    [3, 1], [4, 0, 2], [5, 1],
                    [6, 0, 4], [1, 3, 5, 7], [8, 4, 2],
                    [3, 7], [6, 4, 8], [7, 5]
                ];
                var tDs = 1000, pickTilePos;
                var newState = false;
                var nxDs = 0;
                for (var i = 0; i < moves[vPos].length; i++) {
                    var dp = depth;
                    var tPos = moves[vPos][i];
                    //simulate the move in sTiles
                    var nxTiles = [...sTiles];
                    nxTiles[vPos] = nxTiles[tPos];
                    nxTiles[tPos] = '';
                    //if nxTiles is same as previous then  drop it
                    if (!isEqual(nxTiles, prevTiles)) {
                        if (dp != 0) {
                            dp--;
                            var rt = pickTileToMoveWithDepth(tPos, dp, nxTiles, sTiles);
                            nxDs = rt.tDs;
                        }
                        // if an adjacent tile is empty
                        if (!stateExists(tPos, vPos)) {
                            newState = true;
                            var ds = getDistance(tPos, vPos, sTiles);
                            //add nxDs
                            ds = ds + nxDs;
                            if (ds <= tDs) {
                                pickTilePos = tPos;
                                tDs = ds;
                            }
                        }
                    }

                }

                return {newState: newState, tPos: pickTilePos, tDs: tDs};

            };

            var tiles = [...this.state.autoTiles];
            var prevStates = this.props.autoPrevStates;

            var vacantPos = findVacant(tiles);
            var sTiles = [...tiles];
            var rt = pickTileToMoveWithDepth(vacantPos, 3, sTiles);
            if (rt.newState == true) {
                var tileEl = document.querySelector('.Auto > .tile:nth-child(' + (rt.tPos + 1 ) + ')');
                this.tileClick(tileEl, rt.tPos, tiles[rt.tPos],tiles,prevStates);

                 var autoSolve = true;
                if(this.props.win==true){
                    this.props.autoWin=true;
                    autoSolve = false;
                }
                this.setState({
                    autoTiles: tiles,
                    autoSolve: autoSolve
                });

            //  if auto solve
                if (auto==true && this.props.win!=true){
                    that=this;
                    setTimeout(function(){that.autoTileClick(true)},500);
                };
            }
        },
        userTileClick: function (tileEl, position, status){
            var tiles = [...this.state.userTiles];
            var prevStates = this.props.userPrevStates;

            if(status!=''){
                this.tileClick(tileEl, position, status,tiles,prevStates);

                var autoSolve = true;
                if(this.props.win==true){
                    this.props.userWin=true;
                    autoSolve = false;
                }

                this.setState({
                    userTiles: tiles,
                    autoSolve: autoSolve
                });

                // after user tile move, call for auto tile move
                if(this.props.win!=true){
                    this.autoTileClick();
                }
            };

        },

        tileClick: function (tileEl, position, status,tiles,prevStates) {

            // Possible moves
            // [up,right,down,left]
            // 9 = out of bounds
            var moves = [
                [null, 1, 3, null], [null, 2, 4, 0], [null, null, 5, 1],
                [0, 4, 6, null], [1, 5, 7, 3], [2, null, 8, 4],
                [3, 7, null, null], [4, 8, null, 6], [5, null, null, 7]
            ];

            // called after tile is fully moved
            // sets new state
            function updateTiles() {
                tiles[position] = '';
                tiles[move] = status;
                prevStates[prevStates.length] = [...tiles];
            };

            // return if they've already won
            if (this.props.win) return;

            // check possible moves
            for (var i = 0; i < moves[position].length; i++) {
                var move = moves[position][i];
                // if an adjacent tile is empty
                if (typeof move === 'number' && !tiles[move]) {
                    updateTiles();
                    this.props.win = this.checkBoard(tiles);
                    break;
                }
            }
        },

        restartGame: function () {
            if(this.state.autoSolve==false){
                //just restart
                this.setState(this.getInitialState());
            }else{
            //    auto solve
                    this.autoTileClick(true);
            };

        },

        render: function () {

            var winStatus='Solve the Puzzle. Every move you make, Bot makes its own!';
            if(this.props.userWin)winStatus='You Win';
            if(this.props.autoWin)winStatus='Bot Wins';
            return (
                <div>
                    <Game  id='User' tiles={this.state.userTiles} tileClick={this.userTileClick}/>
                    <Game  id='Auto' tiles={this.state.autoTiles} />
                    <Menu winClass={this.props.win ? 'button win' : 'button'}
                          status={winStatus} restart={this.restartGame} buttonText={this.state.autoSolve?'Auto Solve':'Restart'}
                    />
                </div>
            )
        }
    });
    var Tile = React.createClass({
        clickHandler: function (e) {
            this.props.tileClick(e.target, this.props.id, this.props.status);
        },
        render: function () {
            return <div className="tile" onClick={this.clickHandler}>{this.props.status}</div>;
        }
    });

    var Menu = React.createClass({
        clickHandler: function () {
            this.props.restart();
        },
        render: function () {
            return <div id="menu">
                <h3 id="subtitle">{this.props.status}</h3>
                <a className={this.props.winClass} onClick={this.clickHandler}>{this.props.buttonText}</a>
            </div>;
        }
    });


    // render Game to container
    React.render(
        <Games/>,
        document.getElementById('game-container')
    );

}());