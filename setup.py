from setuptools import setup, find_packages

with open("requirements.txt") as f:
    install_requires = f.read().strip().split("\n")

from freshlife import __version__ as version

setup(
    name="freshlife",
    version=version,
    description="FreshLife Omnichannel Supermarket Custom App for ERPNext",
    author="FreshLife",
    author_email="",
    packages=find_packages(),
    zip_safe=False,
    include_package_data=True,
    install_requires=install_requires,
)
