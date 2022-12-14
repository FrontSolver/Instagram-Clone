import React, { Fragment, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import {  useRecoilState } from 'recoil'
import { modalState } from '../atoms/modalAtom'
import { CameraIcon } from '@heroicons/react/outline'
import { Dialog, Transition } from '@headlessui/react'
import { addDoc, collection, serverTimestamp, updateDoc, doc } from 'firebase/firestore'
import { ref, getDownloadURL, uploadString } from 'firebase/storage'
import { db, storage } from '../firebase'

function Modal() {
    const { data: session } = useSession()
    const [open, setOpen] = useRecoilState(modalState)
    const filePickerRef = useRef(null)
    const captionRef = useRef(null)
    const [loading, setLoading] = useState(false)
    const [selectedFile, setSelectedFile] = useState(null);
    const uploadPost = async () => {
        if (loading) return;
        setLoading(true)
        const docRef = await addDoc(collection(db, 'posts'), {
            username: session.user.username,
            caption: captionRef.current.value,
            profileImg: session.user.image,
            timestamp: serverTimestamp()
        });
        console.log("New doc added with ID", docRef.id);
        const imageRef = ref(storage, `posts/${docRef.id}/image`);
        await uploadString(imageRef, selectedFile, "data_url").then(async (snapshot) =>{
            const downloadURL = await getDownloadURL(imageRef);
            await updateDoc(doc(db, 'posts', docRef.id), {
                image: downloadURL,
            });
        });
        setOpen(false);
        setLoading(false);
        setSelectedFile(null);
    }
        const addImageToPost = (e) => {
            const reader = new FileReader();
            if (e.target.files[0]) {
                reader.readAsDataURL(e.target.files[0]);
            }
            reader.onload = (readerEvent) => {
                setSelectedFile(readerEvent.target.result)
            } 
        }
    return (
        <Transition.Root show={open} as={Fragment}>
            <Dialog
                as="div"
                className="fixed inset-0 z-10 overflow-y-auto"
                onClose={setOpen}
            >
                <div className="flex min-h-[800px] items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:min-h-screen sm:p-0">
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <Dialog.Overlay className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" />
                    </Transition.Child>
                    <span
                        className="hidden sm:inline-block sm:h-screen sm:align-middle"
                        aria-hidden="true"
                    >
                        &#8203
                    </span>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="inline-block px-4 pt-5 pb-4 overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:w-full sm:max-w-sm sm:p-6 sm:align-middle">
                            <div>
                                {selectedFile ? (
                                    <img className='object-contain w-full cursor-pointer' src={selectedFile} onClick={() => setSelectedFile(null)} alt="" />
                                ) : (
                                    <div
                                        onClick={() => filePickerRef.current.click()} className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full cursor-pointer max-auto">
                                        <CameraIcon
                                            className="w-6 h-6 text-red-600"
                                            aria-hidden="true"
                                        />
                                    </div>
                                )}
                                <div>
                                    <div className='mt-3 text-center sm:mt-5'>
                                        <Dialog.Title as='h3' className='text-lg font-medium leading-6 text-gray-900' >
                                            Sekil Paylas
                                        </Dialog.Title>
                                    </div>
                                    <input
                                        ref={filePickerRef}
                                        type="file"
                                        hidden
                                        onChange={addImageToPost}
                                    />
                                </div>
                                <div className='mt-2'>
                                    <input className='w-full text-center border-none focus:ring-0'
                                        type="text"
                                        ref={captionRef}
                                        placeholder='Please enter a caption ...' />
                                </div>

                                <div className="mt-5 sm:mt-6">
                                    <button
                                        disabled={!selectedFile}
                                        onClick={uploadPost}
                                        type="button"
                                        className="inline-flex justify-center w-full px-4 py-2 text-base font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-300 hover:disabled:bg-gray-300 sm:text-sm "
                                    >
                                        {loading ? "Uploading..." : "Upload Post"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </Transition.Child>
                </div>
            </Dialog>
        </Transition.Root>
    )
}

export default Modal