/** @jsx React.DOM */

// ReactJS Slide Puzzle
// Author:     Evan Henley
// Author URI: henleyedition.com

(function () {

    var Game = React.createClass({


        getInitialState: function () {

            return {
                // initial state of game board
                tiles: [...this.props.initState],
                win: false,
                prevStates: [[...this.props.initState]]
            };
        },
        checkBoard: function () {
            var tiles = this.state.tiles;

            for (var i = 0; i < tiles.length - 1; i++) {
                if (tiles[i] !== i + 1) return false;
            }

            return true;
        },

        getWinStatus: function(){
          return this.state.win;
        },
        tileMove: function () {

            //get element from position
            function findVacant() {
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
                        if(dp != 0) {
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

            var tiles = this.state.tiles;
            var prevStates = this.state.prevStates;

            var vacantPos = findVacant();
            var sTiles = [...tiles];
            var rt = pickTileToMoveWithDepth(vacantPos,3, sTiles);
            if (rt.newState == true) {
                var tileEl = document.querySelector('.Auto > .tile:nth-child(' + (rt.tPos + 1 ) + ')');
                this.tileClick(tileEl, rt.tPos, tiles[rt.tPos]);
            }
        },
        tileClick: function (tileEl, position, status) {

            var tiles = this.state.tiles;
            var prevStates = this.state.prevStates;
            // Possible moves
            // [up,right,down,left]
            // 9 = out of bounds
            var moves = [
                [null, 1, 3, null], [null, 2, 4, 0], [null, null, 5, 1],
                [0, 4, 6, null], [1, 5, 7, 3], [2, null, 8, 4],
                [3, 7, null, null], [4, 8, null, 6], [5, null, null, 7]
            ];

            function animateTiles(i, move) {
                var directions = ['up', 'right', 'down', 'left'];
                // var moveToEl = document.querySelector('.tile:nth-child(' + (move + 1) + ')');
                direction = directions[i];
                tileEl.classList.add('move-' + direction);
                // this is all a little hackish.
                // css/js are used together to create the illusion of moving blocks
                setTimeout(function () {
                    // moveToEl.classList.add('highlight');
                    tileEl.classList.remove('move-' + direction);
                    // time horribly linked with css transition
                    setTimeout(function () {
                        // moveToEl.classList.remove('highlight');
                    }, 400);
                }, 200);
            }

            // called after tile is fully moved
            // sets new state
            function afterAnimate() {
                tiles[position] = '';
                tiles[move] = status;
                prevStates[prevStates.length] = [...tiles];

                //propogate value to parent
                var winVal = this.checkBoard();
                this.props.onWin(winVal);

                this.setState({
                    tiles: tiles,
                    moves: moves,
                    win: winVal,
                    prevStates: prevStates
                });



            };

            // return if they've already won
            if (this.state.win) return;

            // check possible moves
            for (var i = 0; i < moves[position].length; i++) {
                var move = moves[position][i];
                // if an adjacent tile is empty
                if (typeof move === 'number' && !tiles[move]) {
                    animateTiles(i, move);
                    setTimeout(afterAnimate.bind(this), 200);
                    this.props.onMove(this.props.type);
                    break;
                }
            }
        },
        componentDidMount:function(){

        },
        // componentWillUnmount:function(){
        //     //inform parent that a tile is moved
        //     this.props.onMove(this.props.type);
        // },
        render: function () {
            function tileMove(){
                this.tileMove();
            }
            if(this.props.autoMove==true && this.props.type=='Auto'){
                //move tile automatically
                setTimeout(tileMove.bind(this), 200);
            }

            return (
                    <span id='game-board' className={this.props.type}>
                    {this.state.tiles.map(function (tile, position) {
                        return ( <Tile status={tile} id={position} tileClick={this.tileClick}/> );
                    }, this)}
                    </span>
            );
                {/*<Menu winClass={this.state.win ? 'button win' : 'button'}*/}
                      {/*status={this.state.win ? 'You win!' : 'Solve the puzzle.'} restart={this.restartGame}*/}
                {/*/>*/}

        }
    });

    var Games = React.createClass({
        shuffle: function (array) {

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

                return array;
            }

            // Fischer-Yates shuffle
            array = fischerYates(array);

            // check for even number of inversions
            if (countInversions(array) % 2 !== 0) {
                // switch two tiles if odd
                array = switchTiles(array);
            }

            return array;
        },
        getInitialState: function () {
            var initState = this.shuffle([
                1, 2, 3,
                4, 5, 6,
                7, 8, ''
            ]);
            // var initState = [
            //     1, 2, 3,
            //     4, 5, 6,
            //     '', 7, 8
            // ];

            return {
                // initial state of game board
                initTiles: initState,
                win: false,
                autoMove:false,
                reStart:false,
            };
        },
        restartGame: function () {
            this.setState(this.getInitialState());
        //  set restart to true
            this.setState({reStart:true});
        },

        onWin:function(val){
            this.setState({
                win:val
            });
        },
        onMove:function (source) {
            if(source=='User') var autoMove = true;
            else var autoMove = false;
            this.setState({
                autoMove:autoMove
            });
        },
       render: function(){
           return(
               <div>

               <Game  type='User' initState={this.state.initTiles} onWin={this.onWin} onMove={this.onMove} autoMove={this.state.autoMove} reStart={this.state.reStart}/>
               <Game  type='Auto' initState={this.state.initTiles} onWin={this.onWin} onMove={this.onMove} autoMove={this.state.autoMove} reStart={this.state.reStart}/>
               <Menu winClass={this.state.win ? 'button win' : 'button'}
                     status={this.state.win ? 'You win!' : 'Solve the puzzle.'} restart={this.restartGame}
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
        nextMoveHandler: function () {
            this.props.nextMove();
        },
        render: function () {
            return <div id="menu">
                <h3 id="subtitle">{this.props.status}</h3>
                <a className={this.props.winClass} onClick={this.clickHandler}>Restart</a>
            </div>;
        }
    });

    // render Game to container
    React.render(
        <Games />,
        document.getElementById('game-container')
    );

}());