import json

from channels.consumer import AsyncConsumer
from channels.exceptions import StopConsumer

from .models import Room, RoomAdmin, Message, User, Media
from channels.db import database_sync_to_async

user_channels = {}


class Consumer(AsyncConsumer):
    active_websockets = "active_websockets"

    async def websocket_connect(self, event):
        await self.send({"type": "websocket.accept"})
        self.user = self.scope["user"]
        print('USER::', self.user)
        user_channels[self.user.id] = self.channel_name
        print("user_channels", user_channels)
        await self.groups_check()

    async def groups_check(self):
        self.user.rooms = await database_sync_to_async(Room.objects.filter)(users=self.user)
        self.user.rooms_list = await database_sync_to_async(list)(self.user.rooms.values())
        print('group is checked', self.user.rooms_list)
        for room in self.user.rooms_list:
            print('ROOM:', room)
            room_name = "Room_group_" + str(room['id'])
            await self.channel_layer.group_add(
                room_name, self.channel_name
            )

    async def websocket_receive(self, event):
        print(event)
        received = json.loads(event["text"])
        try:
            request = received["request"]
        except KeyError:
            request = "none"
        await self.request_handler(request, received)

    async def request_handler(self, request, received):
        print("received: ", received, request)
        match request:
            case "connect":
                answer = {"connect": "success"}
                print('answered: ', json.dumps(answer))
                await self.send({
                    "type": "websocket.send",
                    "text": json.dumps(answer)
                })
            case "none":
                received['status'] = 'no request'
                print('answered: ', json.dumps(received))
                await self.send({
                    "type": "websocket.send",
                    "text": json.dumps(received)
                })
            case "user":
                answer = await self.get_user_data()
                print('answered: ', answer)
                await self.send({
                    "type": "websocket.send",
                    "text": answer
                })
            case "groups":
                rooms = {
                    'rooms': await database_sync_to_async(list)
                    (await database_sync_to_async(Room.objects.filter(users=self.user).values)())
                }
                json_rooms = json.dumps(rooms)
                print('answered: ', rooms)
                await self.send({
                    "type": "websocket.send",
                    "text": json_rooms
                })
            case "group_data":
                room_messages = await database_sync_to_async(list)(
                    await database_sync_to_async(
                        Message.objects.filter(room_id=received["room_id"]).values)())
                for i in range(len(room_messages)):
                    if room_messages[i]["has_media"]:
                        await database_sync_to_async(print)(
                            await database_sync_to_async(
                                Media.objects.filter(message_id=room_messages[i]["id"]).values)())
                        room_messages[i]["media"] = await database_sync_to_async(list)(
                            await database_sync_to_async(
                                Media.objects.filter(message_id=room_messages[i]["id"]).values)())
                    room_messages[i]['timestamp'] = room_messages[i]['timestamp'].strftime("%Y%m%d%H%M%S")
                users = await database_sync_to_async(Room.objects.get)(id=received["room_id"])
                users_data = await database_sync_to_async(list)(users.users.all().values('id', 'username'))
                room_data = {
                    'messages': room_messages,
                    'users': users_data,
                }
                print('answered: send all room messages')
                json_data = json.dumps(room_data)
                await self.send({
                    "type": "websocket.send",
                    "text": json_data
                })
            case "send_message":
                print('answered: save_message')
                await self.message_handler(received)
                # await self.send({
                #     "type": "websocket.send",
                #     "text": json.dumps(received)
                # })
            case "group_send":
                group_answer = {
                    "type": "group_send",
                    "text": json.dumps(received),
                }
                await self.channel_layer.group_send(
                    self.active_websockets, group_answer
                )
            case "rename_room":
                if len(received['name']) > 0:
                    await self.rename_room(received['room_id'], received['name'])
                    answer = {
                        "success": True,
                        "reload": "rooms"
                    }
                    await self.send({
                        "type": "websocket.send",
                        "text": json.dumps(answer)
                    })
            case "users":
                users_data = await database_sync_to_async(list)(User.objects.all().values('id', 'username'))
                answer = {
                    "allUsers": users_data
                }
                print('answered: ', json.dumps(answer))
                await self.send({
                    "type": "websocket.send",
                    "text": json.dumps(answer)
                })
            case "invite":
                try:
                    if received["user_id"] and received["room_id"]:
                        room = await database_sync_to_async(Room.objects.get)(pk=received['room_id'])
                        if await database_sync_to_async(room.users.filter(id=received['user_id']).exists)():
                            answer = {
                                "error": True,
                                "data": "user is in the room already",
                            }
                        else:
                            user = await database_sync_to_async(User.objects.get)(pk=received['user_id'])
                            await database_sync_to_async(room.users.add)(user)
                            room_name = "Room_group_" + str(received["room_id"])
                            try:
                                channel_name = user_channels[received["user_id"]]
                                await self.channel_layer.group_add(
                                    room_name, channel_name
                                )
                                channel_message = {
                                    "type": 'websocket.receive',
                                    "text": json.dumps({"request": "groups"})
                                }
                                await self.channel_layer.send(channel=channel_name, message=channel_message)
                            except:
                                ...
                            finally:
                                answer = {
                                    "success": True,
                                    "reload": "room",
                                }
                except Exception as e:
                    answer = {
                        "error": True,
                        "data": repr(e),
                    }
                finally:
                    print('answered: ', json.dumps(answer))
                    await self.send({
                        "type": "websocket.send",
                        "text": json.dumps(answer)
                    })
            case "kick":
                try:
                    room = await database_sync_to_async(Room.objects.get)(pk=received['room_id'])
                    if received["user_id"] == self.user.id:
                        answer = {
                            "error": True,
                            "data": "cannot kick yourself",
                        }
                    elif await database_sync_to_async(room.users.filter(id=received['user_id']).exists)():
                        user = await database_sync_to_async(User.objects.get)(pk=received['user_id'])
                        await database_sync_to_async(room.users.remove)(user)
                        room_name = "Room_group_" + str(received["room_id"])
                        try:
                            channel_name = user_channels[received["user_id"]]
                            await self.channel_layer.group_discard(
                                room_name, channel_name
                            )
                            channel_message = {
                                "type": 'websocket.receive',
                                "text": json.dumps({"request": "groups"})
                            }
                            await self.channel_layer.send(channel=channel_name, message=channel_message)
                        except:
                            ...
                        finally:
                            answer = {
                                "success": True,
                                "reload": "room",
                            }
                    else:
                        answer = {
                            "error": True,
                            "data": "invalid data",
                        }
                except Exception as e:
                    answer = {
                        "error": True,
                        "data": repr(e),
                    }
                finally:
                    print('answered: ', json.dumps(answer))
                    await self.send({
                        "type": "websocket.send",
                        "text": json.dumps(answer)
                    })
            case "leave":
                try:
                    room = await database_sync_to_async(Room.objects.get)(pk=received['room_id'])
                    if await database_sync_to_async(room.users.filter(id=self.user.id).exists)():
                        user = await database_sync_to_async(User.objects.get)(pk=self.user.id)
                        await database_sync_to_async(room.users.remove)(user)
                        room_name = "Room_group_" + str(received['room_id'])
                        await self.channel_layer.group_discard(
                            room_name, self.channel_name
                        )
                        answer = {
                            "success": True,
                            "reload": "rooms",
                        }
                    else:
                        answer = {
                            "error": True,
                            "data": "you are not in the room",
                        }
                except Exception as e:
                    answer = {
                        "error": True,
                        "data": repr(e),
                    }
                finally:
                    print('answered: ', json.dumps(answer))
                    await self.send({
                        "type": "websocket.send",
                        "text": json.dumps(answer)
                    })
            case "delete_room":
                # user_is_admin() admin rights check is not implemented yet
                try:
                    room = await database_sync_to_async(Room.objects.get)(pk=received['room_id'])
                    if await database_sync_to_async(room.users.filter(id=self.user.id).exists)():
                        await database_sync_to_async(room.delete)()
                        answer = {
                            "success": True,
                            "reload": "rooms",
                        }
                    else:
                        answer = {
                            "error": True,
                            "data": "you are not in the room",
                        }
                except Exception as e:
                    answer = {
                        "error": True,
                        "data": repr(e),
                    }
                finally:
                    print('answered: ', json.dumps(answer))
                    await self.send({
                        "type": "websocket.send",
                        "text": json.dumps(answer)
                    })
            case "new_room":
                if received["name"] and received["creator"]:
                    room = await database_sync_to_async(Room.objects.create)(
                        name=received["name"]
                    )
                    admin = await database_sync_to_async(User.objects.get)(pk=received["creator"])
                    await database_sync_to_async(room.users.add)(admin)
                    room_admins = await database_sync_to_async(RoomAdmin.objects.create)(
                        room_id=room
                    )
                    await database_sync_to_async(room_admins.admins.add)(admin)
                    for user_data in received['users']:
                        user = await database_sync_to_async(User.objects.get)(pk=user_data['id'])
                        await database_sync_to_async(room.users.add)(user)
                    answer = {
                        "success": True,
                        "reload": "rooms",
                    }
                    print('answered: ', json.dumps(answer))
                    await self.send({
                        "type": "websocket.send",
                        "text": json.dumps(answer)
                    })
                else:
                    answer = {
                        "error": True,
                        "data": "Incorrect or incomplete data",
                    }
                    print('answered: ', json.dumps(answer))
                    await self.send({
                        "type": "websocket.send",
                        "text": json.dumps(answer)
                    })
            case _:
                received['status'] = 'wrong request'
                print('answered: ', json.dumps(received))
                await self.send({
                    "type": "websocket.send",
                    "text": json.dumps(received)
                })

    async def rename_room(self, room_id, new_name):
        room = await database_sync_to_async(Room.objects.get)(id=room_id)
        room.name = new_name
        await database_sync_to_async(room.save)()
        print(f'renamed room {room_id} to {new_name}')

    async def get_user_data(self):
        answer = {
            "user": {
                "id": self.user.id,
                "username": self.user.username,
            }
        }
        return json.dumps(answer)

    async def message_handler(self, message_data):
        print("Message Data", message_data)
        if len(message_data['message']) > 0:
            room = (await database_sync_to_async(Room.objects.get)(id=message_data['room']))
            message = await database_sync_to_async(Message.objects.create)(
                message=message_data['message'][0:200],
                room_id=room,
                author_id=self.user,
                has_media=message_data['has_media'],
            )
            await database_sync_to_async(message.save)()
            await self.send({
                "type": "websocket.send",
                "text": json.dumps({
                    "yourMessage": {
                        "id": message.id,
                        "message": message.message,
                        "room_id": message_data['room'],
                        "author_id": self.user.id,
                        "has_media": message_data['has_media'],
                    }
                })
            })
            await self.update_message(message.id, message_data['room'])

    async def update_message(self, message_id, room_id=None):
        await self.groups_check()
        # print(self.user.rooms_list)
        # print("room", list(filter(lambda r: r['id'] == room_id, self.user.rooms_list)))
        room = list(filter(lambda r: r['id'] == room_id, self.user.rooms_list))[0]
        room_name = "Room_group_" + str(room['id'])
        message = await database_sync_to_async(list)(
            await database_sync_to_async(
                Message.objects.filter(id=message_id).values)())
        if message[0]["has_media"]:
            await database_sync_to_async(print)(
                await database_sync_to_async(
                    Media.objects.filter(message_id=message[0]["id"]).values)())
            message[0]["media"] = await database_sync_to_async(list)(
                await database_sync_to_async(
                    Media.objects.filter(message_id=message[0]["id"]).values)())
        message[0]['timestamp'] = message[0]['timestamp'].strftime("%Y%m%d%H%M%S")
        answer = {
            'newMessage': message[0],
        }
        group_answer = {
            "type": "group_send",
            "text": json.dumps(answer),
        }
        await self.channel_layer.group_send(
            room_name, group_answer
        )

    async def group_send(self, answer):
        print('answer ', answer)
        await self.send({
            "type": "websocket.send",
            "text": answer["text"]
        })

    async def websocket_disconnect(self, event):
        print("websocket disconnected", event)
        for room in self.user.rooms_list:
            room_name = "Room_group_" + str(room['id'])
            await self.channel_layer.group_discard(
                room_name, self.channel_name
            )
        raise StopConsumer()
