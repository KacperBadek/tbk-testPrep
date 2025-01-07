const express = require('express');
const router = express.Router();
const Movie = require("../models/Movie");

router.get("/", async (req, res) => {
    try {
        const movies = await Movie.find();
        res.json(movies);

    } catch (error) {
        res.status(500).json({error: 'Failed to retrieve movies'});
    }
})

router.get("/:id", async (req, res) => {
    try {
        const {id} = req.params;
        const movie = await Movie.findById(id);
        if (!movie) {
            return res.status(404).json({error: `No movie found with id: ${req.params.id}`});
        }
        res.json(movie);

    } catch (error) {
        res.status(500).json({error: `Failed to retrieve movie with id: ${req.params.id}`});
    }
})

router.post("/", async (req, res) => {
    try {

        const newMovieData = req.body;
        const movieToSave = new Movie(newMovieData);
        await movieToSave.save();
        res.status(201).json(movieToSave);
    } catch (error) {
        res.status(500).json({error: 'Failed to upload movie'});
    }
})

router.put("/:id", async (req, res) => {
    try {
        const {id} = req.params;
        const updatedMovieData = req.body;

        const updateData = {
            title: updatedMovieData.title,
            director: updatedMovieData.director,
            genre: updatedMovieData.genre,
            releaseYear: updatedMovieData.releaseYear,
            rating: updatedMovieData.rating
        }

        const updatedMovie = await Movie.findByIdAndUpdate(id, updateData, {new: true, runValidators: true});

        if (!updatedMovie) {
            return res.status(404).json({message: `No movie with id ${id} found.`});
        }
        res.status(200).json(updatedMovie);

    } catch (error) {
        res.status(500).json({error: `Failed to edit movie with id: ${req.params.id}`});
    }
})

router.delete("/:id", async (req, res) => {
    try {
        const {id} = req.params;
        const deletedMovie = await Movie.findByIdAndDelete(id);
        if (!deletedMovie) {
            return res.status(404).json({error: `No movie with id: ${req.params.id}`});
        }
        res.status(200).send({message: "Movie deleted successfully.", movie: deletedMovie});

    } catch (error) {
        res.status(500).json({error: `Failed to delete movie with id: ${req.params.id}`});
    }
})

router.get("/aggregate/average-ratings", async (req, res) => {
    try {

        const averageRatings = await Movie.aggregate([
            {
                $group: {
                    _id: "$genre", // Grupowanie według gatunku
                    averageRating: {$avg: "$rating"} // Obliczanie średniej oceny
                }
            },
            {
                $project: {
                    _id: 0, // Ukrycie pola _id w wynikach
                    genre: "$_id", // Przypisanie gatunku do pola "genre"
                    averageRating: 1 // Zostawienie średniej oceny w wynikach
                }
            },
            {
                $sort: {genre: 1} // Sortowanie wyników alfabetycznie po gatunku
            }

        ]);
        res.status(200).json(averageRatings);

    } catch (error) {
        res.status(500).json({error: 'Failed to retrieve movies'});
    }
})

module.exports = router