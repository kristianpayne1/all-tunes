import React, { Component } from 'react';
import SpotifyWebApi from 'spotify-web-api-js';
import { Redirect } from 'react-router-dom';
import { Table, Button } from 'react-bootstrap';

const spotifyApi = new SpotifyWebApi();

class Home extends Component {
    constructor() {
        super();
        const params = this.getHashParams();
        const token = params.access_token;
        if (token) {
            spotifyApi.setAccessToken(token);
        }
        this.state = {
            loggedIn: token ? true : false,
            topArtists: [],
            topSongs: [],
            recommendedSongs: [],
        }
    }

    componentDidMount() {
        this.getTopArtists();
        this.getTopSongs();
    }

    getHashParams = () => {
        var hashParams = {};
        var e, r = /([^&;=]+)=?([^&;]*)/g,
            q = window.location.hash.substring(1);
        e = r.exec(q)
        while (e) {
            hashParams[e[1]] = decodeURIComponent(e[2]);
            e = r.exec(q);
        }
        return hashParams;
    }

    getTopArtists = () => {
        spotifyApi.getMyTopArtists({ time_range: 'long_term', limit: 50 })
            .then((response) => {
                console.log(response);
                let topArtists = [];
                response.items.forEach(artist => {
                    topArtists.push(artist);
                });
                this.setState({ topArtists: topArtists });
            })
    }

    renderTopArtists = () => {
        return this.state.topArtists.map((artist, index) => {
            let genres = '';
            artist.genres.forEach((genre) => {
                genres += genre + ', '
            })
            const { id, name } = artist //destructuring
            return (
                <tr key={id}>
                    <td>{index + 1}</td>
                    <td>{name}</td>
                    <td>{genres}</td>
                </tr>
            )
        })
    }

    getTopSongs = () => {
        spotifyApi.getMyTopTracks({ time_range: 'long_term', limit: 50 })
            .then((response) => {
                console.log(response);
                let topSongs = [];
                response.items.forEach(song => {
                    topSongs.push(song);
                });
                this.setState({ topSongs: topSongs });
            })
    }

    renderTopSongs = () => {
        return this.state.topSongs.map((song, index) => {
            let artists = '';
            song.artists.forEach((artist) => {
                artists += artist.name + ', '
            })
            const { id, name, popularity } = song //destructuring
            return (
                <tr key={id}>
                    <td>{index + 1}</td>
                    <td>{name}</td>
                    <td>{artists}</td>
                    <td>{popularity}</td>
                </tr>
            )
        })
    }

    getRecommendations = () => {
        //let genres = this.getTopGenres();

        let seedArtists = '';
        //let seedSongs = '';
        //let seedGenres = '';
        for (let i = 0; i < 5; i++) {
            seedArtists += this.state.topArtists[i].id + ',';
        }

        // for (let i = 0; i < 5; i++) {
        //     seedGenres += genres[i] + ',';
        // }

        spotifyApi.getRecommendations({ seed_artists: seedArtists, min_danceability: 0.75, min_energy: 0.75, min_popularity: 60, min_tempo: 80 })
            .then((response) => {
                console.log(response);
                let recommendedSongs = [];
                response.tracks.forEach((song) => {
                    recommendedSongs.push(song);
                })
                let sortedSongs = this.sortRecommendedSongs(recommendedSongs);
                this.setState({ recommendedSongs: sortedSongs });
            })
    }

    sortRecommendedSongs = (songs) => {
        let n = songs.length;
        for (let i = 1; i < n; ++i) { 
            let key = songs[i]; 
            let j = i - 1; 
  
            while (j >= 0 && songs[j].popularity < key.popularity) { 
                songs[j + 1] = songs[j]; 
                j = j - 1; 
            } 
            songs[j + 1] = key; 
        } 
        return songs;
    }

    getTopGenres = () => {
        // to be returned
        let topGenres = [];
        // map genres to their points
        let genreMap = new Map();
        // keep track of what artists have been already accounted for
        let artists = [];

        this.state.topArtists.forEach((artist) => {
            artists.push(artist);
            artist.genres.forEach((genre) => {
                if (genreMap.has(genre)) {
                    let points = genreMap.get(genre) + 1;
                    genreMap.set(genre, points);
                } else {
                    genreMap.set(genre, 1);
                }
            })
        })

        this.state.topSongs.forEach((song) => {
            song.artists.forEach((artist) => {
                if (!artists.includes(artist)) {
                    artists.push(artist);
                    spotifyApi.getArtist(artist.id)
                        .then((response) => {
                            response.genres.forEach((genre) => {
                                if (genreMap.has(genre)) {
                                    let points = genreMap.get(genre) + 1;
                                    genreMap.set(genre, points);
                                } else {
                                    genreMap.set(genre, 1);
                                }
                            })
                        })
                }
            })
        })

        for (let i = 0; i < 5; i++) {
            let currentTopGenrePoint = 0;
            let currentTopGenre = '';
            genreMap.forEach((value, key) => {
                if (value > currentTopGenrePoint) {
                    currentTopGenrePoint = value;
                    currentTopGenre = key;
                }
            });
            console.log(currentTopGenre + ' = ' + currentTopGenrePoint)
            topGenres.push(currentTopGenre);
            genreMap.delete(currentTopGenre);
        }

        return topGenres;
    }

    renderRecommendedSongs = () => {
        return this.state.recommendedSongs.map((song, index) => {
            let artists = '';
            song.artists.forEach((artist) => {
                artists += artist.name + ', '
            })
            const { id, name, popularity } = song //destructuring
            return (
                <tr key={id}>
                    <td>{index + 1}</td>
                    <td>{name}</td>
                    <td>{artists}</td>
                    <td>{popularity}</td>
                </tr>
            )
        })
    }

    render() {
        let redirect = !this.state.loggedIn ? <Redirect to="/" /> : null;
        let recommendedTable = this.state.recommendedSongs.length !== 0 ?
            <Table striped bordered hover>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Recommended songs</th>
                        <th>Artist(s)</th>
                        <th>Popularity</th>
                    </tr>
                </thead>
                <tbody>
                    {this.renderRecommendedSongs()}
                </tbody>
            </Table> :
            null;
        return (
            <div>
                {redirect}
                <h1>Home</h1>
                <Table striped bordered hover>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Top artists</th>
                            <th>Genres</th>
                        </tr>
                    </thead>
                    <tbody>
                        {this.renderTopArtists()}
                    </tbody>
                </Table>
                <br />
                <Table striped bordered hover>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Top songs</th>
                            <th>Artist(s)</th>
                            <th>Popularity</th>
                        </tr>
                    </thead>
                    <tbody>
                        {this.renderTopSongs()}
                    </tbody>
                </Table>
                <Button onClick={this.getRecommendations}>Get recommendations</Button>
                <p>Get recommendated songs</p>
                {recommendedTable}
            </div>
        )
    }
}

export default Home;