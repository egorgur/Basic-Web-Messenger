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
                print("answered: ", json.dumps(answer))
                await self.send({
                    "type": "websocket.send",
                    "text": json.dumps(answer)
                })
            case "none":
                received["status"] = "no request"
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
            case "rooms":
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
            case "room_messages":
                messages_request_count = received["messages_request_count"]
                room_messages = await database_sync_to_async(list)(
                    await database_sync_to_async(
                        Message.objects.filter(room_id=received["room_id"]).order_by("-timestamp")
                        [10 * messages_request_count:10 * (messages_request_count + 1)].values)())
                #        portion in 10 messages
                for i in range(len(room_messages)):
                    if room_messages[i]["has_media"]:
                        await database_sync_to_async(print)(
                            await database_sync_to_async(
                                Media.objects.filter(message_id=room_messages[i]["id"]).values)())
                        room_messages[i]["media"] = await database_sync_to_async(list)(
                            await database_sync_to_async(
                                Media.objects.filter(message_id=room_messages[i]["id"]).values)())
                    room_messages[i]['timestamp'] = room_messages[i]['timestamp'].strftime("%Y%m%d%H%M%S")

                room_data_messages = {
                    "messages": room_messages
                }
                print('answered:', "Send all messages")
                await self.send({
                    "type": "websocket.send",
                    "text": json.dumps(room_data_messages)
                })
            case "group_data":
                room = await database_sync_to_async(Room.objects.get)(id=received["room_id"])
                room_administration = await database_sync_to_async(RoomAdmin.objects.get)(room_id=received["room_id"])
                room_name = room.name
                room_owner_id = room_administration.owner
                room_admins = await database_sync_to_async(list)(
                    room_administration.admins.all().values('id', 'username'))
                room_users = await database_sync_to_async(list)(room.users.all().values('id', 'username'))
                room_rules = room.rules
                room_data = {
                    "roomId": received["room_id"],
                    "roomName": room_name,
                    "roomRules": room_rules,
                    "users": room_users,
                    "ownerId": room_owner_id,
                    "admins": room_admins,
                }
                print('answered:', room_data)
                await self.send({
                    "type": "websocket.send",
                    "text": json.dumps(room_data)
                })
            case "send_message":
                print('answered: save_message')
                await self.message_handler(received)
            case "group_send":
                group_answer = {
                    "type": "group_send",
                    "text": json.dumps(received),
                }
                await self.channel_layer.group_send(
                    self.active_websockets, group_answer
                )
            case "rename_room":
                room_administration = await database_sync_to_async(
                    RoomAdmin.objects.get)(room_id=received["room_id"])
                room = await database_sync_to_async(Room.objects.get)(pk=received["room_id"])
                if self.user.id != room_administration.owner:
                    if not await database_sync_to_async(
                            room_administration.admins.filter(id=self.user.id).exists)():
                        if room.rules != "none":
                            if not json.loads(room.rules)["ruleUserCanRenameRoom"]:
                                answer = {
                                    "error": True,
                                    "data": "users cannot rename this room",
                                }
                                await self.send({
                                    "type": "websocket.send",
                                    "text": json.dumps(answer)
                                })
                                print("user cannot rename room because of the rules")
                                return 0
                    else:
                        if room.rules != "none":
                            if not json.loads(room.rules)["ruleAdminCanRenameRoom"]:
                                answer = {
                                    "error": True,
                                    "data": "admin cannot rename this room",
                                }
                                await self.send({
                                    "type": "websocket.send",
                                    "text": json.dumps(answer)
                                })
                                print("admin cannot rename room because of the rules")
                                return 0
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
            case "save_rules":
                room_id = received["room_id"]
                rules = received["rules"]
                room = await database_sync_to_async(Room.objects.get)(pk=room_id)
                room_rules = room.rules
                room_administration = await database_sync_to_async(RoomAdmin.objects.get)(room_id=room_id)
                if database_sync_to_async(room_administration.admins.filter(id=self.user.id).exists)():
                    if room_rules == "none":
                        room_rules = {
                            "ruleUserCanPost": rules["ruleUserCanPost"],
                            "ruleUserCanRenameRoom": rules["ruleUserCanRenameRoom"],
                            "ruleUserCanInvite": rules["ruleUserCanInvite"],
                            "ruleUserCanKick": rules["ruleUserCanKick"],
                        }
                    else:
                        room_rules = json.loads(room_rules)
                        room_rules["ruleUserCanPost"] = rules["ruleUserCanPost"]
                        room_rules["ruleUserCanRenameRoom"] = rules["ruleUserCanRenameRoom"]
                        room_rules["ruleUserCanInvite"] = rules["ruleUserCanInvite"]
                        room_rules["ruleUserCanKick"] = rules["ruleUserCanKick"]
                    if self.user.id == room_administration.owner:
                        room_rules["ruleAdminCanRenameRoom"] = rules["ruleAdminCanRenameRoom"]
                        room_rules["ruleAdminCanAddAdmins"] = rules["ruleAdminCanAddAdmins"]
                        room_rules["ruleAdminCanRemoveAdmins"] = rules["ruleAdminCanRemoveAdmins"]
                    room.rules = json.dumps(room_rules)
                    await database_sync_to_async(room.save)()
                    print(room.rules)
                    answer = {
                        "success": True,
                        "reload": "room",
                    }
                    room_name = "Room_group_" + str(room_id)
                    group_request = {
                        "type": "group_send",
                        "text": json.dumps(answer),
                    }
                    await self.channel_layer.group_send(
                        room_name, group_request
                    )
                else:
                    answer = {
                        "error": True,
                        "data": "you are not an admin",
                    }

                await self.send({
                    "type": "websocket.send",
                    "text": json.dumps(answer)
                })

            case "remove_admin":
                room_id = received["room_id"]
                user_id = received["user_id"]
                room = await database_sync_to_async(Room.objects.get)(pk=room_id)
                if await database_sync_to_async(room.users.filter(id=received['user_id']).exists)():
                    room_administration = await database_sync_to_async(RoomAdmin.objects.get)(room_id=room_id)
                    if self.user.id != room_administration.owner:
                        if await database_sync_to_async(
                                room_administration.admins.filter(id=self.user.id).exists)():
                            if room.rules != "none":
                                if not json.loads(room.rules)["ruleAdminCanRemoveAdmins"]:
                                    answer = {
                                        "error": True,
                                        "data": "admin cannot remove admins",
                                    }
                                    await self.send({
                                        "type": "websocket.send",
                                        "text": json.dumps(answer)
                                    })
                                    print("admin cannot remove admins")
                                    return 0
                    if user_id == room_administration.owner:
                        answer = {
                            "error": True,
                            "data": "user is an owner",
                        }
                    elif await database_sync_to_async(
                            room_administration.admins.filter(id=received['user_id']).exists)():
                        user = await database_sync_to_async(User.objects.get)(pk=user_id)
                        await database_sync_to_async(room_administration.admins.remove)(user)
                        await (database_sync_to_async(print)
                               (await database_sync_to_async(room_administration.admins.all)()))
                        answer = {
                            "success": True,
                            "reload": "room",
                        }
                        try:
                            room_name = "Room_group_" + str(room_id)
                            channel_name = user_channels[received["user_id"]]
                            await self.channel_layer.group_discard(
                                room_name, channel_name
                            )
                            channel_message = {
                                "type": 'websocket.receive',
                                "text": json.dumps({
                                    "request": "group_data",
                                    "room_id": room_id
                                })
                            }
                            await self.channel_layer.send(channel=channel_name, message=channel_message)
                        except:
                            ...
                    else:
                        answer = {
                            "error": True,
                            "data": "user is not an admin",
                        }
                else:
                    answer = {
                        "error": True,
                        "data": "user is not in the room",
                    }
                await self.send({
                    "type": "websocket.send",
                    "text": json.dumps(answer)
                })
            case "make_admin":
                room_id = received["room_id"]
                user_id = received["user_id"]
                room = await database_sync_to_async(Room.objects.get)(pk=room_id)
                if await database_sync_to_async(room.users.filter(id=received['user_id']).exists)():
                    room_administration = await database_sync_to_async(RoomAdmin.objects.get)(room_id=room_id)
                    if self.user.id != room_administration.owner:
                        if await database_sync_to_async(
                                room_administration.admins.filter(id=self.user.id).exists)():
                            if room.rules != "none":
                                if not json.loads(room.rules)["ruleAdminCanAddAdmins"]:
                                    answer = {
                                        "error": True,
                                        "data": "admin cannot add new admins",
                                    }
                                    await self.send({
                                        "type": "websocket.send",
                                        "text": json.dumps(answer)
                                    })
                                    print("admin cannot add mew admins")
                                    return 0
                    if not await database_sync_to_async(
                            room_administration.admins.filter(id=received['user_id']).exists)():
                        user = await database_sync_to_async(User.objects.get)(pk=user_id)
                        await database_sync_to_async(room_administration.admins.add)(user)
                        await (database_sync_to_async(print)
                               (await database_sync_to_async(room_administration.admins.all)()))
                        answer = {
                            "success": True,
                            "reload": "room",
                        }
                        try:
                            room_name = "Room_group_" + str(room_id)
                            channel_name = user_channels[received["user_id"]]
                            await self.channel_layer.group_discard(
                                room_name, channel_name
                            )
                            channel_message = {
                                "type": 'websocket.receive',
                                "text": json.dumps({
                                    "request": "group_data",
                                    "room_id": room_id
                                })
                            }
                            await self.channel_layer.send(channel=channel_name, message=channel_message)
                        except:
                            ...
                    else:
                        answer = {
                            "error": True,
                            "data": "user is an admin already",
                        }
                else:
                    answer = {
                        "error": True,
                        "data": "user is not in the room",
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
                            room_administration = await database_sync_to_async(
                                RoomAdmin.objects.get)(room_id=received["room_id"])
                            if self.user.id != room_administration.owner:
                                if not await database_sync_to_async(
                                        room_administration.admins.filter(id=self.user.id).exists)():
                                    if room.rules != "none":
                                        if not json.loads(room.rules)["ruleUserCanInvite"]:
                                            answer = {
                                                "error": True,
                                                "data": "users cannot invite in this room",
                                            }
                                            await self.send({
                                                "type": "websocket.send",
                                                "text": json.dumps(answer)
                                            })
                                            print("user cannot invite because of the rules")
                                            return 0
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
                                    "text": json.dumps({"request": "rooms"})
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

                        room_administration = await database_sync_to_async(
                            RoomAdmin.objects.get)(room_id=received["room_id"])
                        if self.user.id != room_administration.owner:
                            if not await database_sync_to_async(
                                    room_administration.admins.filter(id=self.user.id).exists)():
                                if room.rules != "none":
                                    if not json.loads(room.rules)["ruleUserCanKick"]:
                                        answer = {
                                            "error": True,
                                            "data": "users cannot kick in this room",
                                        }
                                        await self.send({
                                            "type": "websocket.send",
                                            "text": json.dumps(answer)
                                        })
                                        print("user cannot kick because of the rules")
                                        return 0

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
                                "text": json.dumps({"request": "rooms"})
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
                if received["name"]:
                    room = await database_sync_to_async(Room.objects.create)(
                        name=received["name"],
                        rools="none",
                    )
                    admin = await database_sync_to_async(User.objects.get)(pk=self.user.id)
                    await database_sync_to_async(room.users.add)(admin)
                    room_admins = await database_sync_to_async(RoomAdmin.objects.create)(
                        room_id=room,
                        owner=self.user.id,
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
        room = (await database_sync_to_async(Room.objects.get)(id=message_data['room_id']))
        room_administration = await database_sync_to_async(RoomAdmin.objects.get)(room_id=message_data["room_id"])
        # the check if user can post messages by rules
        if self.user.id != room_administration.owner:
            if not await database_sync_to_async(room_administration.admins.filter(id=self.user.id).exists)():
                if room.rules != "none":
                    if not json.loads(room.rules)["ruleUserCanPost"]:
                        answer = {
                            "error": True,
                            "data": "users cannot post in this room",
                        }
                        await self.send({
                            "type": "websocket.send",
                            "text": json.dumps(answer)
                        })
                        print("user cannot post because of the rules")
                        return 0

        if len(message_data['message']) > 0:
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
                        "room_id": message_data['room_id'],
                        "author_id": self.user.id,
                        "has_media": message_data['has_media'],
                    }
                })
            })
            if not message_data['has_media']:
                print("no media")
                room_name = "Room_group_" + str(message_data['room_id'])
                message_data["message_id"] = message.id
                group_request = {
                    "type": "update_message_call",
                    "text": json.dumps(message_data),
                }
                await self.channel_layer.group_send(
                    room_name, group_request
                )

    async def update_message_call(self, received):
        print("update message call")
        request = json.loads(received['text'])
        print(request, type(request))
        message_id = request["message_id"]
        room_id = request["room_id"]
        await self.update_message(message_id, room_id)

    async def update_message(self, message_id, room_id):
        await self.groups_check()
        room = await database_sync_to_async(Room.objects.get)(pk=room_id)
        room_name = "Room_group_" + str(room.id)
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

        await self.send({
            "type": "websocket.send",
            "text": json.dumps(answer),
        })
        # group_answer = {
        #     "type": "group_send",
        #     "text": json.dumps(answer),
        # }
        # await self.channel_layer.group_send(
        #     room_name, group_answer
        # )

    async def group_send(self, answer):
        print('answer ', answer)
        await self.send({
            "type": "websocket.send",
            "text": answer["text"]
        })

    async def group_receive(self, request):
        print("group received request: ", request)
        # await self.update_message()
        # await self.group_send({
        #     "type": "ping",
        #     "text": request["text"]
        # })

    async def websocket_disconnect(self, event):
        print("websocket disconnected", event)
        for room in self.user.rooms_list:
            room_name = "Room_group_" + str(room['id'])
            await self.channel_layer.group_discard(
                room_name, self.channel_name
            )
        raise StopConsumer()
