import React, { FC } from "react";
import { Disclosure, Transition, Listbox } from "@headlessui/react";
import { IconCheck, IconChevronDown, IconPlus, IconUser, IconCircleMinus } from "@tabler/icons-react";
import { loginState, workspacestate } from "@/state"

import { useForm, FormProvider } from "react-hook-form";
import { role } from "@/utils/database";
import type toast from "react-hot-toast";


import { useRecoilState } from "recoil";
import Input from "@/components/input";
import axios from "axios";
import clsx from 'clsx';

type Props = {
	users: any[];
	roles: role[];
};

type form = {
	username: string;
};

const Button: FC<Props> = (props) => {
	const [workspace, setWorkspace] = useRecoilState(workspacestate);
	const [users, setUsers] = React.useState(props.users);
	const [login, setLogin] = useRecoilState(loginState)
	const [showRemoveModal, setShowRemoveModal] = React.useState(false);
	const [userToRemove, setUserToRemove] = React.useState<number | null>(null);

	const userForm = useForm<form>();
	const { roles } = props;

	const updateRole = async (id: number, roleid: string) => {
		const user = users.findIndex((user: any) => user.userid === id);
		if (!user) return;
		const usi = users;
		const role = roles.find((role: any) => role.id === roleid);
		if (!role) return;
		usi[user].roles = [role];
		setUsers([...usi]);
		await axios.post(
			`/api/workspace/${workspace.groupId}/settings/users/${id}/update`,
			{ role: role.id }
		);
	};

	const removeUser = async (id: number) => {
		// Prevent removing the currently authenticated user
		if (id === login.userId) {
			if (typeof window !== "undefined") {
				const toast = (await import("react-hot-toast")).default;
				toast.error("You cannot remove yourself.");
			}
			return;
		}
		const user = users.find((user: any) => user.userid === id);
		if (!user) return;
		setUsers(users.filter((user: any) => user.userid !== id));
		await axios.delete(`/api/workspace/${workspace.groupId}/settings/users/${id}/remove`);
		if (typeof window !== "undefined") {
			const toast = (await import("react-hot-toast")).default;
			toast.success("User removed successfully.");
		}
	};

	const addUser = async () => {
		const user = await axios.post(`/api/workspace/${workspace.groupId}/settings/users/add`, {
			username: userForm.getValues().username,
		}).catch(err => {
			userForm.setError("username", { type: "custom", message: err.response.data.error })
		});
		if (!user) return;
		userForm.clearErrors()
		setUsers([...users, user.data.user]);
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h3 className="text-lg font-medium text-zinc-900 dark:text-white">Users</h3>
				<div className="flex items-center space-x-3">
					<FormProvider {...userForm}>
						<div className="flex items-center space-x-2">
							<Input
								{...userForm.register("username")}
								label=""
								placeholder="Enter username"
								classoverride="w-48 py-1.5 text-sm"
							/>
							<button
								onClick={addUser}
								className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 transition-colors"
							>
								<IconPlus size={16} className="mr-1.5" />
								Add User
							</button>
						</div>
					</FormProvider>
				</div>
			</div>

			<div className="space-y-3">
				{roles.map((role) => (
					<Disclosure
						as="div"
						key={role.id}
						className="bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 shadow-sm"
					>
						{({ open }) => (
							<>
								<Disclosure.Button
									className="w-full px-4 py-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-lg"
								>
									<div className="flex items-center justify-between">
										<div className="flex items-center space-x-2">
											<span className="text-sm font-medium text-zinc-900 dark:text-white">{role.name}</span>
											<span className="text-xs text-zinc-500 dark:text-zinc-400">
												({users.filter((user: any) => user.roles[0].id === role.id).length} users)
											</span>
										</div>
										<IconChevronDown
											className={clsx(
												"w-5 h-5 text-zinc-500 transition-transform",
												open ? "transform rotate-180" : ""
											)}
										/>
									</div>
								</Disclosure.Button>

	<Transition
									enter="transition duration-100 ease-out"
									enterFrom="transform scale-95 opacity-0"
									enterTo="transform scale-100 opacity-100"
									leave="transition duration-75 ease-out"
									leaveFrom="transform scale-100 opacity-100"
									leaveTo="transform scale-95 opacity-0"
								>
									<Disclosure.Panel className="px-4 pb-4">
										{users.filter((user: any) => user.roles[0].id === role.id).length > 100 ? (
											<p className="text-sm text-zinc-500 dark:text-zinc-400">
												Too many users to display (max 100)
											</p>
										) : (
											<div className="space-y-2">
												{users.filter((user: any) => user.roles[0].id === role.id).map((user: any) => (
													<div
														key={user.userid}
														className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-zinc-700"
													>
														<div className="flex items-center space-x-3">
															<img
																src={user.thumbnail}
																alt={user.displayName}
																className="w-10 h-10 rounded-full"
															/>
															<div>
																<div className="flex items-center space-x-2">
																	<p className="text-sm font-medium text-zinc-900 dark:text-white">
																		{user.displayName}
																	</p>
																	{user.roles[0].isOwnerRole === true && (
																		<span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
																			Owner
																		</span>
																	)}
																</div>
																<p className="text-xs text-zinc-500 dark:text-zinc-400">
																	@{user.username}
																</p>
															</div>
														</div>
														<div className="flex items-center space-x-2 ml-auto">
															<Listbox
																value={user.roles[0].id}
																onChange={(value) => updateRole(user.userid, value)}
																disabled={user.roles[0].isOwnerRole === true}
															>
																<div className="relative">
																	<Listbox.Button className={clsx(
																		"relative w-40 py-2 pl-3 pr-10 text-left bg-white dark:text-white dark:bg-zinc-700 rounded-lg border border-gray-300 dark:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary/50",
																		user.roles[0].isOwnerRole === true 
																			? "cursor-not-allowed opacity-50" 
																			: "cursor-pointer"
																	)}>
																		<span className="block truncate text-sm">
																			{user.roles[0].name}
																		</span>
																		<span className="absolute inset-y-0 right-0 flex items-center pr-2">
																			<IconChevronDown className="w-5 h-5 text-zinc-400" />
																		</span>
																	</Listbox.Button>
																	<Transition
																		as={React.Fragment}
																		leave="transition ease-in duration-100"
																		leaveFrom="opacity-100"
																		leaveTo="opacity-0"
																	>
																		<Listbox.Options className="absolute z-10 w-full py-1 mt-1 overflow-auto text-base bg-white dark:bg-zinc-700 rounded-md shadow-lg max-h-60 ring-1 ring-black ring-opacity-5 focus:outline-none">
																			{workspace.roles.filter(role => !role.isOwnerRole).map((role) => (
																				<Listbox.Option
																					key={role.id}
																					value={role.id}
																					className={({ active }) =>
																						clsx(
																							"relative cursor-pointer select-none py-2 pl-10 pr-4",
																							active
																								? "bg-primary/10 text-primary"
																								: "text-zinc-900 dark:text-zinc-100"
																						)
																					}
																				>
																					{({ selected }) => (
																						<>
																							<span className="block truncate text-sm">
																								{role.name}
																							</span>
																							{selected ? (
																								<span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary">
																									<IconCheck className="w-5 h-5" />
																								</span>
																							) : null}
																						</>
																					)}
																				</Listbox.Option>
																			))}
																		</Listbox.Options>
																	</Transition>
																</div>
															</Listbox>
															{user.roles[0].isOwnerRole === true && (
																<div className="text-xs text-zinc-500 dark:text-zinc-400 max-w-32">
																	Owner role cannot be changed
																</div>
															)}
															{!user.roles[0].isOwnerRole && (
																<button
																	onClick={() => { setUserToRemove(user.userid); setShowRemoveModal(true); }}
																	className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors"
																>
																	<IconCircleMinus width={16} height={16} className="mr-1.5" />
																	Remove
																</button>
															)}
														</div>
													</div>
												))}
											</div>
										)}
									</Disclosure.Panel>
								</Transition>
							</>
						)}
					</Disclosure>
				))}
			</div>

			{showRemoveModal && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
					<div className="bg-white dark:bg-zinc-800 rounded-lg shadow-xl p-6 w-full max-w-sm text-center">
						<h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
							Remove User
						</h2>
						<p className="text-sm text-zinc-600 dark:text-zinc-300 mb-6">
							Are you sure you want to remove this user? This action cannot be undone.
						</p>
						<div className="flex justify-center gap-4">
							<button
								onClick={() => setShowRemoveModal(false)}
								className="px-4 py-2 rounded-md bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 text-zinc-800 dark:text-white"
							>
								Cancel
							</button>
							<button
								onClick={async () => {
									if (userToRemove) {
										await removeUser(userToRemove);
										setShowRemoveModal(false);
										setUserToRemove(null);
									}
								}}
								className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
							>
								Remove
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default Button;