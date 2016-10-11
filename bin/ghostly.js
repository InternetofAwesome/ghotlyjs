var config = require('../config.json')
var sonos = require('sonos');
var fs = require('fs')
var shuffle = require('shuffle-array')
var app = require('../app.js')
var util = require('util')
var inspect = util.inspect

var devices = []
var rooms = []
var soundsperroom = []
var sounds = []

function addDevice(device, description)
{
	// device.deviceDescription(console.log)
	// if(!(description.roomName in rooms))
	if(rooms[description.roomName] === undefined)
	{
		rooms[description.roomName] = {'name': description.roomName}
		if(rooms[description.roomName].devices === undefined)
			rooms[description.roomName].devices = []
		rooms[description.roomName].devices.push(device)
		if(!rooms[description.roomName].tracklist)
			rooms[description.roomName].tracklist = shuffle(sounds, { 'copy': true })
		schedule(rooms[description.roomName])
	}	
}

function findDevices()
{
	sonos.search(function(device) {
	  // device is an instance of sonos.Sonos
	  // device.currentTrack(console.log);
	  // device.getVolume(console.log);
	  // device.play('https://upload.wikimedia.org/wikipedia/commons/6/68/Turdus_merula_male_song_at_dawn%2820s%29.ogg', console.log)
	  // device.parseDIDL(console.log)
	  // device.getCurrentState(console.log)
		device.deviceDescription(function(err, desc)
		{
			addDevice(device, desc)
		})
	})
}

function ghostly(app)
{
	app = app
	console.log("port: " + app.port)
	//get some files from the asset dir
	fs.readdir('./public/assets', function(err, files)
	{
		sounds = files;
		for(i=0; i<sounds.length; i++)
			sounds[i] = 'http://' + app.address + ':' + app.port + '/' + sounds[i]

		findDevices()
	})
}

function schedule(room)
{
	if(room.tracklist === undefined || room.tracklist.length==0)
	{
		room.tracklist = shuffle(sounds, { 'copy': true })
		console.log("new shuffle: " + room.tracklist)
	}
	var track = room.tracklist.pop()
	// var interval = (config.min_interval+Math.random(2*config.min_interval))*60*1000
	var interval = 5000
	var current_date = new Date(Date.now()+interval) 
	var datestr = current_date.toISOString()
	var volume = config.vol_min+Math.random(config.vol_max-config.vol_min)
	console.log(util.format("%s, %s, %s", track, room.name, datestr))
	setTimeout(function()
	{
		console.log(util.format("Playing %s in %s", track, room.name))
		room.devices.forEach(function(d)
		{
			d.getQueue(function(err, queue)
			{
				d.queueNext(track, function(e)
				{
					d.play(function()
					{
						d.next(function()
						{
							// d.flush(function()
							// {
							// 	queue.forEach(function(s)
							// 	{
							// 		console.log(s)
							// 	})
							// })
						})
					})
				})
			})
			// works, but adds stuff to the queue
			// d.queueNext(track, function(e)
			// {
			// 	d.play(function()
			// 	{
			// 		d.next(function()
			// 		{
			// 			console.log("did next")
			// 		})
			// 	})
			// })
		})
		schedule(room)
	}, interval)
}

module.exports = ghostly